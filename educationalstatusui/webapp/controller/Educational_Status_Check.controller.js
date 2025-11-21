sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
], (Controller, JSONModel, Fragment, Filter, FilterOperator, MessageBox, MessageToast, Dialog) => {
    "use strict"

    return Controller.extend("com.lt.educationalstatusui.controller.Educational_Status_Check", {

        async onInit() {
            //Model Initialization
            let oModel = new JSONModel()
            this.getView().setModel(oModel, "psidModel")

            //PSID Status Model
            let statusModel = new JSONModel()
            this.getView().setModel(statusModel, "psidStatusModel")

            //ICHR Model
            let ichrModel = new JSONModel()
            this.getView().setModel(ichrModel, "ichrModel")

            //PSID ICHR Model
            let psidICHRModel = new JSONModel()
            this.getView().setModel(psidICHRModel, "psidICHRModel")

            //Fetch PSIDs
            // await this.fetchPSIDRecords()
        },

        // fetchPSIDRecords() {
        //     return new Promise((resolve, reject) => {
        //         let oModel = this.getOwnerComponent().getModel()
        //         let oBinding = oModel.bindList("/Educational_Details")

        //         oBinding.requestContexts(0, this.allCountSum).then((aContexts) => {
        //             let oData = aContexts.map((oContext) => oContext.getObject())

        //             // Use Map for unique PSIDs
        //             let uniqueMap = new Map()
        //             oData.forEach(item => {
        //                 if (!uniqueMap.has(item.psid)) {
        //                     uniqueMap.set(item.psid, item)
        //                 }
        //             })

        //             // Convert Map values to array
        //             let uniqueData = Array.from(uniqueMap.values())
        //             this.getView().getModel("psidModel").setData(uniqueData)
        //             this.getView().getModel("psidModel").updateBindings()

        //             resolve(uniqueData)
        //         })
        //             .catch((oError) => {
        //                 console.error("Error fetching records:", oError)
        //                 reject(oError)
        //             })
        //     })
        // },

        // //Value Help for PS ID
        // psidValueHelp() {
        //     let oView = this.getView()

        //     if (!this._psidDialog) {
        //         this._psidDialog = Fragment.load({
        //             id: oView.getId(),
        //             name: "com.lt.educationalstatusui.view.fragments.PSIDValueHelp",
        //             controller: this
        //         }).then(function (oDialog) {
        //             oView.addDependent(oDialog)
        //             return oDialog
        //         })
        //     }

        //     this._psidDialog.then(function (oDialog) {
        //         oDialog.open()
        //     }.bind(this))
        // },

        // //Value Help Search for PS ID
        // psidSearch(oEvent) {
        //     let oBinding = oEvent.getSource().getBinding("items")
        //     let sValue = oEvent.getParameter("value")
        //     let oFilter = new Filter({
        //         filters: [
        //             new Filter("psid", FilterOperator.Contains, sValue),
        //             new Filter("name", FilterOperator.Contains, sValue)
        //         ],
        //         and: false
        //     })
        //     oBinding.filter([oFilter])
        // },

        // //Value Help Confirm for PS ID
        // async psidClose(oEvent) {
        //     let sValue = oEvent.getParameter("selectedItem").getTitle()
        //     if (sValue && sValue.length) {
        //         this.byId("psidStatus").setValue(sValue)
        //     }
        //     oEvent.getSource().getBinding("items").filter([])
        //     // await this.psidDataFetch(sValue)
        // },

        //Fetch Records for the selected PSID 
        psidDataFetch(filters) {
            return new Promise((resolve, reject) => {
                let oModel = this.getOwnerComponent().getModel()
                let oBinding = oModel.bindList("/Educational_Details", undefined, undefined, filters)

                oBinding.requestContexts().then((aContexts) => {
                    let aData = aContexts.map((oContext) => oContext.getObject())
                    resolve(aData)
                }).catch((oError) => {
                    console.error("Error fetching PSID data:", oError)
                    reject(oError)
                })
            })
        },

        //On PSID Status GO Button Press
        async psidStatusSearch() {
            let psidVal = this.byId("psidStatus").getValue()
            let filters = [new Filter("psid", FilterOperator.EQ, psidVal)]
            let statusData = await this.psidDataFetch(filters)

            this.getView().getModel("psidStatusModel").setData(statusData)
            this.getView().getModel("psidStatusModel").updateBindings()
        },

        //On PSID ICHR Search Button Press
        async psidICHRSearch() {
            let ichrVal = this.byId("psidICHR").getValue()
            let filters = [new Filter("ichr", FilterOperator.EQ, ichrVal)]
            let ichrData = await this.psidDataFetch(filters)

            this.getView().getModel("ichrModel").setData(ichrData)
            this.getView().getModel("ichrModel").updateBindings()

            //To have only uique PSIDs
            const uniqueRecords = Array.from(
                new Map(ichrData.map(item => [item.psid, item])).values()
            )

            this.getView().getModel("psidICHRModel").setData(uniqueRecords)
            this.getView().getModel("psidICHRModel").updateBindings()
        },

        //On Status Save Button Press
        onStatusSave() {
            this.getView().setBusy(true)
            //Input Values
            let psidVal = this.byId("psidStatus").getValue()
            let status = this.byId("statusSelect").getSelectedKey()

            switch (status) {
                case "I":
                    this.onDeleteRecords(psidVal)
                    break
                case "D":
                    this.onUpdateRecords(psidVal, status, ichrVal)
                    break
                default:
                    if (!psidVal) {
                        MessageBox.warning("User has not entered PSID for Status Change, \n\nPlease Enter the PSID before proceeding ahead.")
                    } else
                        MessageBox.warning("Please Select the Status for Updatation before proceeding with Save.")
                    break
            }
        },

        //Status change to: I(Initial Draft) for selected PSID
        async onDeleteRecords(psidVal) {
            const oModel = this.getOwnerComponent().getModel();
            const aData = this.getView().getModel("psidStatusModel").getData();
            const groupId = "deleteGroup";

            try {
                const folderDeleted = await this.deleteSubFolderIfExists("/Educational_Certificates", psidVal);

                if (!folderDeleted) {
                    console.warn("Deletion failed.");
                    this.getView().setBusy(false)
                    return;
                }

                if (!aData.length) {
                    MessageBox.error("There are no records to delete.");
                    this.getView().setBusy(false)
                    return;
                }

                // Delete all records in batch
                for (const item of aData) {
                    const oBinding = oModel.bindContext(`/Educational_Details('${item.ID}')`, null, { groupId });
                    await oBinding.requestObject();
                    const oContext = oBinding.getBoundContext();
                    oContext.delete(groupId);
                }

                await oModel.submitBatch(groupId);
                MessageBox.success(`Status changed to Initial Draft for the PSID: ${psidVal}`);
                this.psidStatusSearch();
                this.getView().setBusy(false)

            } catch (error) {
                MessageBox.error(`Error deleting records\n\n${error}`);
                console.error(error);
            }
        },

        async deleteSubFolderIfExists(mainFolderPath, subFolderName) {
            const oDMSRoot = this.getOwnerComponent().getManifestObject().resolveUri('DMS_Dest');
            const sChildrenUrl = `${oDMSRoot}${mainFolderPath}?cmisselector=children`;

            try {
                const response = await jQuery.ajax({
                    url: sChildrenUrl,
                    type: "GET",
                    headers: { "Accept": "application/json" }
                });

                if (!response?.objects?.length) {
                    MessageToast.show(`No subfolders found in ${mainFolderPath}`);
                    console.log(`No subfolders found in ${mainFolderPath}`);
                    return true;
                }

                const found = response.objects.find(obj =>
                    obj.object.properties["cmis:name"].value === subFolderName
                );

                if (!found) {
                    MessageToast.show(`Subfolder '${subFolderName}' does not exist in ${mainFolderPath}`);
                    console.log(`Subfolder '${subFolderName}' does not exist in ${mainFolderPath}`);
                    return true;
                }

                const objectId = found.object.properties["cmis:objectId"].value;
                const oForm = new FormData();
                oForm.append("cmisaction", "deleteTree");
                oForm.append("objectId", objectId);
                oForm.append("allVersions", "true");
                oForm.append("unfileObjects", "delete");
                oForm.append("continueOnFailure", "true");

                await jQuery.ajax({
                    url: `${oDMSRoot}${mainFolderPath}`,
                    type: "POST",
                    headers: { "Accept": "application/json" },
                    data: oForm,
                    contentType: false,
                    processData: false
                });

                console.log(`Subfolder '${subFolderName}' deleted successfully.`);
                MessageToast.show(`Subfolder '${subFolderName}' deleted successfully.`);
                return true;

            } catch (error) {
                MessageBox.error(`Error deleting subfolder: ${error.responseText || error}`);
                this.getView().setBusy(false)
                return false;
            }
        },

        //Status change to: D(Save As Draft) for selected PSID
        async onUpdateRecords(psidVal, status, ichrVal) {
            let oModel = this.getOwnerComponent().getModel()
            let oData = status
                ? this.getView().getModel("psidStatusModel").getData()
                : this.getView().getModel("ichrModel").getData()

            let groupId = "updateGroup"

            try {
                for (let item of oData) {
                    // Create context binding for each ID
                    let oBinding = oModel.bindContext(`/Educational_Details('${item.ID}')`, null, { groupId })

                    // Wait for context to load
                    await oBinding.requestObject()
                    let oContext = oBinding.getBoundContext()

                    // Set properties for update
                    if (status) oContext.setProperty("status", status)
                    else if (ichrVal) oContext.setProperty("ichr", ichrVal)
                }

                if (oData.length) {
                    // Submit all changes in one batch
                    await oModel.submitBatch(groupId)
                    if (status) {
                        MessageBox.success("Status changed to Save As Draft for the PSID: " + psidVal)
                        this.psidStatusSearch()
                    }
                    else {
                        MessageBox.success("ICHR changed from " + psidVal + "   to " + ichrVal)
                        this.psidICHRSearch()
                    }
                } else MessageBox.error("There is no records to Update.")
                this.getView().setBusy(false)
            }

            catch (oError) {
                MessageBox.error("Error updating records\n\n" + oError)
                console.error(oError)
                this.getView().setBusy(false)
            }
        },

        onChangeICHR() {
            let psidVal = this.byId("psidICHR").getValue()
            if (!psidVal) {
                MessageBox.warning("User has not entered PSID for ICHR Change, \n\nPlease Enter the PSID before proceeding ahead.")
                return
            }

            //To empty ICHR Input
            if (sap.ui.core.Element.getElementById("idICHR"))
                sap.ui.core.Element.getElementById("idICHR").setValue()

            if (!this.ichrDialog) {
                this.ichrDialog = new Dialog({
                    type: sap.m.DialogType.Message,
                    title: "",
                    content: [
                        new sap.m.Label({
                            text: "Please Enter the ICHR ID in the input box:",
                            labelFor: "idICHR"
                        }),
                        new sap.m.Input("idICHR", {
                            width: "100%",
                            type: "Number",
                            class: "sapUiSmallMarginTop",
                            liveChange: function (oEvent) {
                                let sText = oEvent.getParameter("value")
                                this.ichrDialog.getBeginButton().setEnabled(sText.length > 0)
                            }.bind(this)
                        })
                    ],
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Submit",
                        enabled: false,
                        press: function () {
                            let ichrVal = sap.ui.core.Element.getElementById("idICHR").getValue()
                            if (ichrVal) this.ichrConfirm(ichrVal)
                            else MessageBox.warning("Please Enter ICHR before proceeding with Submit.")
                            this.ichrDialog.close()
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this.ichrDialog.close()
                        }.bind(this)
                    })
                })
            }

            this.ichrDialog.open()
        },

        ichrConfirm(ichrVal) {
            this.getView().setBusy(true)
            let psidVal = this.byId("psidICHR").getValue()
            let oModel = this.getOwnerComponent().getModel("sfapi")

            let sPath = "/EmpJobRelationships/$count"
            let oParams = {
                urlParameters: {
                    "$filter": "relUserId eq '" + ichrVal + "' and relationshipType eq '2829'"
                },
                success: function (oData) {
                    if (oData > 0) {
                        this.onUpdateRecords(psidVal, "", ichrVal)
                    } else {
                        MessageBox.warning("Please Enter Valid ICHR.")
                    }
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching count:", oError)
                }
            }

            // Call the read method
            oModel.read(sPath, oParams)
        }
    })
})
