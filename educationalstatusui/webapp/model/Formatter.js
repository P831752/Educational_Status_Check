
sap.ui.define([], function () {
    "use strict"
    return {

        getStatusText(status) {
            switch (status) {
                case "PA":
                    return "Pending Approval"
                case "A":
                    return "Approved"
                case "D":
                    return "Save As Draft"
                case "SA":
                    return "Self Approved"
                case "R":
                    return "Rejected"
                default:
                    return ""
            }
        }

    }
})