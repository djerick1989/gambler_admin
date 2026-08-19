$ErrorActionPreference = "Stop"

$Profile = "ludopata-prod"
$Region = "us-east-2"
$AccountId = $null

$ClusterName = "ludopata-api-cluster"
$ServiceName = "ludopata-api-service"
$EcrRepoName = "ludopata-api"
$ContainerName = "ludopata-api"
$TaskFamily = "ludopata-api-task"
$LogGroupName = "/aws/ecs/ludopata-api"
$BucketName = "ludopata-prod-media-130356666336"
$BackendDir = "C:\Users\xioma\OneDrive\Documents\GitHub\ludo"
$EnvFile = Join-Path $BackendDir ".env"

$TaskExecutionRoleName = "ludopata-api-ecs-execution-role"
$TaskRoleName = "ludopata-api-ecs-task-role"
$AlbName = "ludopata-api-alb"
$TargetGroupName = "ludopata-api-tg"
$AlbSgName = "ludopata-api-alb-sg"
$TaskSgName = "ludopata-api-task-sg"

function Invoke-AwsJson {
    param([Parameter(ValueFromRemainingArguments = $true)][object[]]$AwsArgs)
    $flatArgs = @()
    foreach ($arg in $AwsArgs) {
        if ($arg -is [System.Array]) {
            foreach ($nestedArg in $arg) {
                $flatArgs += [string]$nestedArg
            }
        } else {
            $flatArgs += [string]$arg
        }
    }
    $output = aws @flatArgs --profile $Profile --region $Region --output json
    if ($LASTEXITCODE -ne 0) {
        throw "AWS command failed: aws $($flatArgs -join ' ')"
    }
    if ([string]::IsNullOrWhiteSpace($output)) {
        return $null
    }
    return $output | ConvertFrom-Json
}

function Invoke-AwsText {
    param([Parameter(ValueFromRemainingArguments = $true)][object[]]$AwsArgs)
    $flatArgs = @()
    foreach ($arg in $AwsArgs) {
        if ($arg -is [System.Array]) {
            foreach ($nestedArg in $arg) {
                $flatArgs += [string]$nestedArg
            }
        } else {
            $flatArgs += [string]$arg
        }
    }
    $output = aws @flatArgs --profile $Profile --region $Region --output text
    if ($LASTEXITCODE -ne 0) {
        throw "AWS command failed: aws $($flatArgs -join ' ')"
    }
    return ($output | Out-String).Trim()
}

function Read-EnvFile {
    param([string]$Path)

    $values = @{}
    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }

        $parts = $line.Split("=", 2)
        $key = $parts[0].Trim()
        $value = $parts[1]
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        $values[$key] = $value
    }

    return $values
}

function Write-JsonFile {
    param(
        [string]$Path,
        [object]$Value,
        [int]$Depth = 20
    )

    $json = $Value | ConvertTo-Json -Depth $Depth
    [System.IO.File]::WriteAllText($Path, $json, [System.Text.UTF8Encoding]::new($false))
}

function Ensure-Role {
    param([string]$RoleName)

    try {
        Invoke-AwsJson @("iam", "get-role", "--role-name", $RoleName) | Out-Null
    } catch {
        $trustPath = Join-Path $PSScriptRoot "ecs-trust-policy.tmp.json"
        $trust = @{
            Version = "2012-10-17"
            Statement = @(
                @{
                    Effect = "Allow"
                    Principal = @{ Service = "ecs-tasks.amazonaws.com" }
                    Action = "sts:AssumeRole"
                }
            )
        }
        Write-JsonFile -Path $trustPath -Value $trust
        aws iam create-role --role-name $RoleName --assume-role-policy-document "file://$trustPath" --profile $Profile --region $Region | Out-Null
    }
}

function Ensure-SecurityGroup {
    param(
        [string]$GroupName,
        [string]$Description,
        [string]$VpcId
    )

    $groupId = Invoke-AwsText @(
        "ec2", "describe-security-groups",
        "--filters", "Name=group-name,Values=$GroupName", "Name=vpc-id,Values=$VpcId",
        "--query", "SecurityGroups[0].GroupId"
    )

    if ([string]::IsNullOrWhiteSpace($groupId) -or $groupId -eq "None") {
        $groupId = Invoke-AwsText @(
            "ec2", "create-security-group",
            "--group-name", $GroupName,
            "--description", $Description,
            "--vpc-id", $VpcId,
            "--query", "GroupId"
        )
    }

    return $groupId
}

function Try-RunAws {
    param([Parameter(ValueFromRemainingArguments = $true)][object[]]$AwsArgs)

    $flatArgs = @()
    foreach ($arg in $AwsArgs) {
        if ($arg -is [System.Array]) {
            foreach ($nestedArg in $arg) {
                $flatArgs += [string]$nestedArg
            }
        } else {
            $flatArgs += [string]$arg
        }
    }

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        aws @flatArgs --profile $Profile --region $Region 2>$null | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
    throw "Missing backend .env file: $EnvFile"
}

$identity = Invoke-AwsJson @("sts", "get-caller-identity")
$AccountId = $identity.Account
$EcrUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/$EcrRepoName"

Write-Host "Deploying Ludopata API to account $AccountId ($Region)" -ForegroundColor Cyan

$envValues = Read-EnvFile -Path $EnvFile
$requiredSecrets = @("CONTEXT_DB_CONNECTION", "PASSWORD_KEY", "TOKEN_KEY", "DEEPL_API_KEY", "OPEN_AI_KEY")
foreach ($key in $requiredSecrets) {
    if (-not $envValues.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envValues[$key])) {
        throw "Missing required value in backend .env: $key"
    }
}

Write-Host "[1/12] ECR repository" -ForegroundColor Yellow
try {
    Invoke-AwsJson @("ecr", "describe-repositories", "--repository-names", $EcrRepoName) | Out-Null
} catch {
    Invoke-AwsJson @(
        "ecr", "create-repository",
        "--repository-name", $EcrRepoName,
        "--image-scanning-configuration", "scanOnPush=true"
    ) | Out-Null
}

Write-Host "[2/12] S3 media bucket" -ForegroundColor Yellow
$bucketExists = Try-RunAws @("s3api", "head-bucket", "--bucket", $BucketName)

if (-not $bucketExists) {
    aws s3api create-bucket `
        --bucket $BucketName `
        --create-bucket-configuration "LocationConstraint=$Region" `
        --profile $Profile `
        --region $Region | Out-Null
}

aws s3api put-public-access-block `
    --bucket $BucketName `
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" `
    --profile $Profile `
    --region $Region | Out-Null

$corsPath = Join-Path $PSScriptRoot "s3-cors.tmp.json"
$cors = @{
    CORSRules = @(
        @{
            AllowedHeaders = @("*")
            AllowedMethods = @("GET", "HEAD")
            AllowedOrigins = @("http://localhost:5173", "https://ludopata.org", "https://www.ludopata.org")
            ExposeHeaders = @("ETag")
            MaxAgeSeconds = 3000
        }
    )
}
Write-JsonFile -Path $corsPath -Value $cors
aws s3api put-bucket-cors --bucket $BucketName --cors-configuration "file://$corsPath" --profile $Profile --region $Region | Out-Null

Write-Host "[3/12] CloudWatch logs" -ForegroundColor Yellow
try {
    Invoke-AwsJson @("logs", "create-log-group", "--log-group-name", $LogGroupName) | Out-Null
} catch {
}
try {
    Invoke-AwsJson @("logs", "put-retention-policy", "--log-group-name", $LogGroupName, "--retention-in-days", "14") | Out-Null
} catch {
}

Write-Host "[4/12] IAM roles and policies" -ForegroundColor Yellow
Ensure-Role -RoleName $TaskExecutionRoleName
Ensure-Role -RoleName $TaskRoleName
aws iam attach-role-policy `
    --role-name $TaskExecutionRoleName `
    --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" `
    --profile $Profile `
    --region $Region | Out-Null

$executionRoleArn = Invoke-AwsText @("iam", "get-role", "--role-name", $TaskExecutionRoleName, "--query", "Role.Arn")
$taskRoleArn = Invoke-AwsText @("iam", "get-role", "--role-name", $TaskRoleName, "--query", "Role.Arn")

Write-Host "[5/12] Secure parameters" -ForegroundColor Yellow
$secretKeys = @(
    "CONTEXT_DB_CONNECTION",
    "PASSWORD_KEY",
    "TOKEN_KEY",
    "DEEPL_API_KEY",
    "OPEN_AI_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_MONTHLY",
    "STRIPE_PRICE_QUARTERLY",
    "STRIPE_PRICE_SEMIANNUAL",
    "STRIPE_PRICE_ANNUAL",
    "SMTP_PASSWORD"
)
$secretArns = @{}
foreach ($key in $secretKeys) {
    if ($envValues.ContainsKey($key) -and -not [string]::IsNullOrWhiteSpace($envValues[$key])) {
        $paramName = "/ludopata/prod/$key"
        aws ssm put-parameter `
            --name $paramName `
            --type SecureString `
            --value $envValues[$key] `
            --overwrite `
            --profile $Profile `
            --region $Region | Out-Null
        $secretArns[$key] = "arn:aws:ssm:$Region`:$AccountId`:parameter$paramName"
    }
}

if ($secretArns.Count -gt 0) {
    $ssmPolicyPath = Join-Path $PSScriptRoot "ssm-policy.tmp.json"
    $ssmPolicy = @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Effect = "Allow"
                Action = @("ssm:GetParameter", "ssm:GetParameters")
                Resource = @($secretArns.Values)
            }
        )
    }
    Write-JsonFile -Path $ssmPolicyPath -Value $ssmPolicy
    aws iam put-role-policy `
        --role-name $TaskExecutionRoleName `
        --policy-name "ludopata-read-ssm-prod" `
        --policy-document "file://$ssmPolicyPath" `
        --profile $Profile `
        --region $Region | Out-Null
}

$s3PolicyPath = Join-Path $PSScriptRoot "s3-policy.tmp.json"
$s3Policy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = @("s3:ListBucket")
            Resource = "arn:aws:s3:::$BucketName"
        },
        @{
            Effect = "Allow"
            Action = @("s3:GetObject", "s3:PutObject", "s3:DeleteObject")
            Resource = "arn:aws:s3:::$BucketName/*"
        }
    )
}
Write-JsonFile -Path $s3PolicyPath -Value $s3Policy
aws iam put-role-policy `
    --role-name $TaskRoleName `
    --policy-name "ludopata-s3-media" `
    --policy-document "file://$s3PolicyPath" `
    --profile $Profile `
    --region $Region | Out-Null

Start-Sleep -Seconds 10

Write-Host "[6/12] Docker build and ECR push" -ForegroundColor Yellow
Push-Location $BackendDir
try {
    cmd /c "aws ecr get-login-password --profile $Profile --region $Region | docker login --username AWS --password-stdin $AccountId.dkr.ecr.$Region.amazonaws.com"
    if ($LASTEXITCODE -ne 0) { throw "Docker login failed" }

    docker build -t "$EcrRepoName`:latest" .
    if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }

    docker tag "$EcrRepoName`:latest" "$EcrUri`:latest"
    docker push "$EcrUri`:latest"
    if ($LASTEXITCODE -ne 0) { throw "Docker push failed" }
} finally {
    Pop-Location
}

Write-Host "[7/12] VPC and subnets" -ForegroundColor Yellow
$vpcId = Invoke-AwsText @(
    "ec2", "describe-vpcs",
    "--filters", "Name=isDefault,Values=true",
    "--query", "Vpcs[0].VpcId"
)
if ([string]::IsNullOrWhiteSpace($vpcId) -or $vpcId -eq "None") {
    throw "Default VPC not found"
}

$subnetRaw = Invoke-AwsText @(
    "ec2", "describe-subnets",
    "--filters", "Name=vpc-id,Values=$vpcId", "Name=default-for-az,Values=true",
    "--query", "Subnets[].SubnetId"
)
$subnetIds = @($subnetRaw -split "\s+" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
if ($subnetIds.Count -lt 2) {
    throw "At least two default subnets are required"
}

Write-Host "[8/12] Security groups" -ForegroundColor Yellow
$albSgId = Ensure-SecurityGroup -GroupName $AlbSgName -Description "Ludopata API ALB" -VpcId $vpcId
$taskSgId = Ensure-SecurityGroup -GroupName $TaskSgName -Description "Ludopata API ECS tasks" -VpcId $vpcId
Try-RunAws @("ec2", "authorize-security-group-ingress", "--group-id", $albSgId, "--protocol", "tcp", "--port", "80", "--cidr", "0.0.0.0/0") | Out-Null
Try-RunAws @("ec2", "authorize-security-group-ingress", "--group-id", $taskSgId, "--protocol", "tcp", "--port", "8080", "--source-group", $albSgId) | Out-Null

Write-Host "[9/12] Load balancer and target group" -ForegroundColor Yellow
$albArn = $null
try {
    $albArn = Invoke-AwsText @("elbv2", "describe-load-balancers", "--names", $AlbName, "--query", "LoadBalancers[0].LoadBalancerArn")
} catch {
}

if ([string]::IsNullOrWhiteSpace($albArn) -or $albArn -eq "None") {
    $createAlbArgs = @(
        "elbv2", "create-load-balancer",
        "--name", $AlbName,
        "--subnets"
    ) + $subnetIds + @(
        "--security-groups", $albSgId,
        "--scheme", "internet-facing",
        "--type", "application",
        "--ip-address-type", "ipv4",
        "--query", "LoadBalancers[0].LoadBalancerArn"
    )
    $albArn = Invoke-AwsText $createAlbArgs
}

$albDns = Invoke-AwsText @("elbv2", "describe-load-balancers", "--load-balancer-arns", $albArn, "--query", "LoadBalancers[0].DNSName")

$targetGroupArn = $null
try {
    $targetGroupArn = Invoke-AwsText @("elbv2", "describe-target-groups", "--names", $TargetGroupName, "--query", "TargetGroups[0].TargetGroupArn")
} catch {
}

if ([string]::IsNullOrWhiteSpace($targetGroupArn) -or $targetGroupArn -eq "None") {
    $targetGroupArn = Invoke-AwsText @(
        "elbv2", "create-target-group",
        "--name", $TargetGroupName,
        "--protocol", "HTTP",
        "--port", "8080",
        "--vpc-id", $vpcId,
        "--target-type", "ip",
        "--health-check-path", "/swagger/index.html",
        "--health-check-protocol", "HTTP",
        "--matcher", "HttpCode=200-399",
        "--query", "TargetGroups[0].TargetGroupArn"
    )
}

$listenerArn = $null
try {
    $listenerArn = Invoke-AwsText @("elbv2", "describe-listeners", "--load-balancer-arn", $albArn, "--query", "Listeners[?Port==``80``].ListenerArn | [0]")
} catch {
}

if ([string]::IsNullOrWhiteSpace($listenerArn) -or $listenerArn -eq "None") {
    $listenerArn = Invoke-AwsText @(
        "elbv2", "create-listener",
        "--load-balancer-arn", $albArn,
        "--protocol", "HTTP",
        "--port", "80",
        "--default-actions", "Type=forward,TargetGroupArn=$targetGroupArn",
        "--query", "Listeners[0].ListenerArn"
    )
}

Write-Host "[10/12] ECS cluster and task definition" -ForegroundColor Yellow
try {
    Invoke-AwsJson @("ecs", "describe-clusters", "--clusters", $ClusterName) | Out-Null
} catch {
}
$clusterDescription = Invoke-AwsJson @("ecs", "describe-clusters", "--clusters", $ClusterName)
if ($clusterDescription.clusters.Count -eq 0) {
    Invoke-AwsJson @("ecs", "create-cluster", "--cluster-name", $ClusterName) | Out-Null
}

if (-not (Try-RunAws @("iam", "get-role", "--role-name", "AWSServiceRoleForECS"))) {
    aws iam create-service-linked-role `
        --aws-service-name "ecs.amazonaws.com" `
        --profile $Profile `
        --region $Region | Out-Null
    Start-Sleep -Seconds 10
}

$environment = @(
    # Keep HTTP enabled for the initial ALB deployment. Move this to Production once
    # a domain and TLS certificate are attached to the load balancer.
    @{ name = "ASPNETCORE_ENVIRONMENT"; value = "Development" },
    @{ name = "ASPNETCORE_URLS"; value = "http://+:8080" },
    @{ name = "AwsS3__BucketName"; value = $BucketName },
    @{ name = "AwsS3__Region"; value = $Region },
    @{ name = "AwsS3__UsePresignedUrl"; value = "true" },
    @{ name = "AwsS3__PresignedUrlExpiresMinutes"; value = "60" },
    @{ name = "AwsS3__UsePublicReadAcl"; value = "false" },
    @{ name = "AWS_S3_BUCKET"; value = $BucketName },
    @{ name = "AWS_S3_REGION"; value = $Region },
    @{ name = "SIGNALR_REDIS_ENABLED"; value = "false" },
    @{ name = "MEDIA_MAX_UPLOAD_BYTES"; value = "524288000" },
    @{ name = "VIDEO_NORMALIZATION_TIMEOUT_MINUTES"; value = "20" }
)

$secrets = @()
foreach ($item in $secretArns.GetEnumerator()) {
    $secrets += @{ name = $item.Key; valueFrom = $item.Value }
}

$taskDefPath = Join-Path $PSScriptRoot "taskdef-prod.generated.json"
$taskDef = @{
    family = $TaskFamily
    networkMode = "awsvpc"
    requiresCompatibilities = @("FARGATE")
    cpu = "1024"
    memory = "2048"
    executionRoleArn = $executionRoleArn
    taskRoleArn = $taskRoleArn
    containerDefinitions = @(
        @{
            name = $ContainerName
            image = "$EcrUri`:latest"
            essential = $true
            portMappings = @(
                @{
                    containerPort = 8080
                    protocol = "tcp"
                }
            )
            environment = $environment
            secrets = $secrets
            logConfiguration = @{
                logDriver = "awslogs"
                options = @{
                    "awslogs-group" = $LogGroupName
                    "awslogs-region" = $Region
                    "awslogs-stream-prefix" = "ecs"
                }
            }
        }
    )
}
Write-JsonFile -Path $taskDefPath -Value $taskDef -Depth 40
$taskDefArn = Invoke-AwsText @(
    "ecs", "register-task-definition",
    "--cli-input-json", "file://$taskDefPath",
    "--query", "taskDefinition.taskDefinitionArn"
)

Write-Host "[11/12] ECS service" -ForegroundColor Yellow
$serviceExists = $false
$serviceDescription = Invoke-AwsJson @("ecs", "describe-services", "--cluster", $ClusterName, "--services", $ServiceName)
if ($serviceDescription.services.Count -gt 0 -and $serviceDescription.services[0].status -ne "INACTIVE") {
    $serviceExists = $true
}

$networkConfiguration = "awsvpcConfiguration={subnets=[$($subnetIds -join ',')],securityGroups=[$taskSgId],assignPublicIp=ENABLED}"
if ($serviceExists) {
    Invoke-AwsJson @(
        "ecs", "update-service",
        "--cluster", $ClusterName,
        "--service", $ServiceName,
        "--task-definition", $taskDefArn,
        "--desired-count", "1",
        "--force-new-deployment"
    ) | Out-Null
} else {
    Invoke-AwsJson @(
        "ecs", "create-service",
        "--cluster", $ClusterName,
        "--service-name", $ServiceName,
        "--task-definition", $taskDefArn,
        "--desired-count", "1",
        "--launch-type", "FARGATE",
        "--platform-version", "LATEST",
        "--network-configuration", $networkConfiguration,
        "--load-balancers", "targetGroupArn=$targetGroupArn,containerName=$ContainerName,containerPort=8080",
        "--health-check-grace-period-seconds", "120"
    ) | Out-Null
}

Write-Host "[12/12] Waiting for service stability" -ForegroundColor Yellow
aws ecs wait services-stable --cluster $ClusterName --services $ServiceName --profile $Profile --region $Region
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Service did not become stable yet. Check ECS events and CloudWatch logs."
}

$serviceStatus = Invoke-AwsJson @(
    "ecs", "describe-services",
    "--cluster", $ClusterName,
    "--services", $ServiceName,
    "--query", "services[0].{status:status,desired:desiredCount,running:runningCount,pending:pendingCount,taskDefinition:taskDefinition,events:events[0:5].message}"
)

Write-Host ""
Write-Host "Deployment summary" -ForegroundColor Green
Write-Host "Account: $AccountId"
Write-Host "ECR: $EcrUri"
Write-Host "S3 bucket: $BucketName"
Write-Host "ECS cluster: $ClusterName"
Write-Host "ECS service: $ServiceName"
Write-Host "Task definition: $taskDefArn"
Write-Host "API URL: http://$albDns"
Write-Host "Health check: http://$albDns/swagger/index.html"
Write-Host ($serviceStatus | ConvertTo-Json -Depth 10)
