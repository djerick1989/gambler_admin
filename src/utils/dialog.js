let alertHandler = null;
let confirmHandler = null;
const nativeConfirm = window.confirm.bind(window);

export const registerDialogHandlers = ({ alert, confirm }) => {
    alertHandler = alert;
    confirmHandler = confirm;

    return () => {
        alertHandler = null;
        confirmHandler = null;
    };
};

export const alertDialog = (message, options = {}) => {
    if (alertHandler) {
        return alertHandler({ message, ...options });
    }

    window.alert(message);
    return Promise.resolve();
};

export const confirmDialog = (message, options = {}) => {
    if (confirmHandler) {
        return confirmHandler({ message, ...options });
    }

    return Promise.resolve(nativeConfirm(message));
};
