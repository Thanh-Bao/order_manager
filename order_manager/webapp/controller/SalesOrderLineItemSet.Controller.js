sap.ui.define([
    "ordermanager/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
],

    function (BaseController, Filter, Sorter) {
        "use strict";

        return BaseController.extend("ordermanager.controller.SalesOrderLineItemSet", {
            onInit: function () {

            },

            handleValueHelp: function () {
                var oInput = this.getView().byId("idInput");
                if (!this._oValueHelpDialog) {
                    this._oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idValueHelp", {
                        supportRanges: true,
                        key: "CompanyCode",
                        descriptionKey: "CompayName",
                        ok: oEvent => {
                            let aTokens = oEvent.getParameter("tokens");
                            // const oProperties = aTokens.data("range");
                            console.log("TOKEN:=>", aTokens)

                            // Create Filter
                            var aFilters = aTokens.map(function (oToken) {
                                if (oToken.data("range")) {
                                    var oRange = oToken.data("range");
                                    return new Filter({
                                        path: "ProductId",
                                        operator: oRange.exclude ? "NE" : oRange.operation,
                                        value1: oRange.value1,
                                        value2: oRange.value2
                                    });
                                }
                                else {
                                    return new Filter({
                                        path: "ProductId",
                                        operator: "EQ",
                                        value1: aTokens[0].getKey()
                                    });
                                }
                            });

                            console.log("Filter", aFilters)

                            oInput.setTokens(aTokens);
                            this._oValueHelpDialog.close();

                        },
                        cancel: () => {
                            this._oValueHelpDialog.close();
                        }
                    })
                }

                // create column structure
                var oColModel = new sap.ui.model.json.JSONModel();
                oColModel.setData({
                    cols: [
                        { label: "dsdsA", template: "CompanyCode" },
                        { label: "dsfsd", template: "CompanyName" },
                        { label: "dsds", template: "City" },
                        { label: "dsds", template: "CurrencyCode" },
                    ]
                })

                var oTable = this._oValueHelpDialog.getTable();
                oTable.setModel(oColModel, "columns")


                //Creating row model and binding it to raw aggregation of table
                var oRowModel = new sap.ui.model.json.JSONModel({
                    ConpanyCodes: [
                        {
                            CompanyCode: "3212",
                            CompanyName: "SAP VN",
                            City: "HCM",
                            CurrencyCode: "EUR"
                        },
                        {
                            CompanyCode: "442",
                            CompanyName: "fff",
                            City: "HNOi",
                            CurrencyCode: "eed"
                        }
                    ]
                })

                oTable.setModel(oRowModel);
                oTable.bindRows("/ConpanyCodes");

                this._oValueHelpDialog.setRangeKeyFields([{
                    label: "Company Code",
                    key: "CompanyCode"
                },
                {
                    label: "Company name",
                    key: "CompanyName"
                }
                ]);

                this._oValueHelpDialog.open();
            }
        });
    });
