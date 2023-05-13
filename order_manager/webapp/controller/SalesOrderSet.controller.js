sap.ui.define([
    "ordermanager/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    'sap/m/Token',
    "sap/ui/model/FilterOperator"
],

    function (BaseController, Filter, Sorter, MessageBox, Token, FilterOperator) {
        "use strict";

        const DEFAULT_LOAD_MORE_STEP = 50;

        const countBillingStatus = [{
            status: 'P',
            total: null
        },
        {
            status: '',
            total: null
        }];
        let totalSaleOrderSet = 0;
        let current_skip = 0;
        let loadMoreTopUserSelect = DEFAULT_LOAD_MORE_STEP;
        let filtersQueryString = [];

        return BaseController.extend("ordermanager.controller.SalesOrderSet", {
            onInit: function () {
                const oView = this.getView();
                var oMultiInput = this.getView().byId("multiInputSearch");
                var oModel = new sap.ui.model.json.JSONModel({
                    SalesOrderSet: [],
                    isShowLoadMoreBtn: false,
                    loadMoreIndicator: false,
                    totalTableLine: 0,
                    totalCurrentTableLine: 0
                });

                oMultiInput.addValidator(function ({ text }) {
                    console.log("here")
                    const token = new Token({ key: text, text: text });
                    filtersQueryString.push(new Filter("SalesOrderID", FilterOperator.EQ, text))
                    return token;
                });

                oView.setModel(oModel, "customSalesOrderSet");
                oView.byId("tbSalesOrderSet")?.setBusy(true);

                // count BillingStatus
                countBillingStatus.map(item => {
                    this.getOwnerComponent().getModel().read("/SalesOrderSet/$count", {
                        filters: [new Filter("BillingStatus", FilterOperator.EQ, item.status)],
                        success: count => {
                            item.total = count;
                        }
                    })
                })

                // count SaleOrderSet
                this.getOwnerComponent().getModel().read("/SalesOrderSet/$count", {
                    success: count => {
                        totalSaleOrderSet = count
                    }
                })
            },
            onAfterRendering: function () {

                const oView = this.getView();
                const oSalesOrderSet = oView.getModel('customSalesOrderSet');

                // get list orders for main table
                const skip = oView.getModel("config").getProperty("/SCREEN/SALES_ORDER_SET/PAGINATION_SKIP_BEGIN");
                this.getView().getModel().read("/SalesOrderSet", {
                    sorters: [new Sorter("BillingStatus", true), new Sorter("SalesOrderID", true)],
                    urlParameters: {
                        $skip: skip,
                        $top: DEFAULT_LOAD_MORE_STEP
                    },
                    success: ({ results }) => {
                        //update main table
                        oView.byId("tbSalesOrderSet")?.setBusy(false);
                        oSalesOrderSet.setProperty(`/SalesOrderSet`, results);
                        //show load more button
                        oSalesOrderSet.setProperty(`/isShowLoadMoreBtn`, true);
                        // count table line
                        oSalesOrderSet.setProperty(`/totalTableLine`, this.formatNumber(totalSaleOrderSet));
                        oSalesOrderSet.setProperty(`/totalCurrentTableLine`, this.formatNumber(results.length));
                        current_skip = DEFAULT_LOAD_MORE_STEP;
                    }
                })
            },
            getGroup: function (oContext) {
                return oContext.getProperty("BillingStatus");
            },
            getGroupHeader: function (oGroup) {
                let count = 0;
                countBillingStatus.forEach(o => {
                    if (o.status === oGroup.key) {
                        count = o.total;
                    }
                });
                return new sap.m.GroupHeaderListItem({
                    title: `${oGroup.key === '' ? "Billing Status empty" : oGroup.key} (${this.formatNumber(count)}) / total ${this.formatNumber(totalSaleOrderSet)}`
                });
            },
            handleValueHelp: function () {
                var oInput = this.getView().byId("multiInputSearch");
                if (!this._oValueHelpDialog) {
                    this._oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog("idValueHelp", {
                        supportRanges: true,
                        supportRangesOnly: true,
                        title: '   ',
                        ok: oEvent => {
                            let aTokens = oEvent.getParameter("tokens");
                            // Create Filter
                            var aFilters = aTokens.map(function (oToken) {
                                if (oToken.data("range")) {
                                    var oRange = oToken.data("range");
                                    return new Filter({
                                        path: oRange.keyField,
                                        operator: oRange.exclude ? FilterOperator.NE : oRange.operation,
                                        value1: oRange.value1,
                                        value2: oRange.value2
                                    });
                                }
                                else {
                                    return new Filter({
                                        path: oRange.keyField,
                                        operator: FilterOperator.EQ,
                                        value1: aTokens[0].getKey()
                                    });
                                }
                            });

                            filtersQueryString = aFilters;
                            oInput.setTokens(aTokens);
                            this._oValueHelpDialog.close();
                        },
                        cancel: () => {
                            this._oValueHelpDialog.close();
                        }
                    })
                }

                //Creating Define Conditions 
                this._oValueHelpDialog.setRangeKeyFields([
                    {
                        label: "Sale order number",
                        key: "SalesOrderID"
                    },
                    {
                        label: "Customer ID",
                        key: "CustomerID"
                    }
                    ,
                    {
                        label: "Product ID",
                        key: "ProductID"
                    }
                ]);

                this._oValueHelpDialog.open();
            },

            onTokenUpdate: function () {
                // var oMultiInput = this.getView().byId("multiInputSearch").getTokens();
                // console.log(oMultiInput)
            },
            applySearch: function () {
                this.getView().getModel().read("/SalesOrderSet", {
                    filters: filtersQueryString,
                    success: ({ results }) => {
                        console.log("filtersQueryString", filtersQueryString)
                        if (results.length) {
                            console.log(results)
                        } else {
                            MessageBox.error("Data not found!");
                        }

                    },
                    error: function () {
                        MessageBox.error("Error, please try again");
                        filtersQueryString = [];
                    },

                })
            },

            onPressSalesOrderLineItemSet: function (SalesOrderID) {
                const oRouter = this.getOwnerComponent().getRouter();
                console.log(SalesOrderID)
                oRouter.navTo("SalesOrderLineItemSet");
            },
            onChangeLoadMoreItem: function (event) {
                loadMoreTopUserSelect = Number(event.getParameters().selectedItem.getText());
            },

            onPressLoadMoreBtn: function () {
                const oView = this.getView();
                const oSalesOrderSet = oView.getModel('customSalesOrderSet');
                oSalesOrderSet.setProperty("/loadMoreIndicator", true);
                oView.getModel().read("/SalesOrderSet", {
                    sorters: [new Sorter("BillingStatus", true), new Sorter("SalesOrderID", true)],
                    urlParameters: {
                        $skip: current_skip,
                        $top: loadMoreTopUserSelect
                    },
                    filters: filtersQueryString,
                    success: ({ results }) => {
                        oSalesOrderSet.setProperty("/loadMoreIndicator", false);
                        //update main table
                        const SalesOrderSet = oSalesOrderSet.getProperty(`/SalesOrderSet`);
                        oSalesOrderSet.setProperty(`/SalesOrderSet`, [...SalesOrderSet, ...results]);
                        oSalesOrderSet.setProperty(`/totalCurrentTableLine`, this.formatNumber(current_skip + results.length));
                        current_skip += loadMoreTopUserSelect;
                    }
                })
            }

        });
    });
