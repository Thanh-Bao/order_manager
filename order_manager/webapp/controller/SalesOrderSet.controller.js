sap.ui.define([
    "ordermanager/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    'sap/m/Token',
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
],

    function (BaseController, Filter, Sorter, ValueHelpDialog, Token, FilterOperator, MessageBox, JSONModel) {
        "use strict";

        const DEFAULT_LOAD_MORE_STEP = 50;
        const COUNT_BILLING_STATUS = [{
            status: 'P',
            total: null
        },
        {
            status: '',
            total: null
        }];
        const DEFAULT_SORTER = [new Sorter("BillingStatus", true), new Sorter("SalesOrderID", true)];

        let totalSaleOrderSet = 0;
        let current_skip = 0;
        let loadMoreTopUserSelect = DEFAULT_LOAD_MORE_STEP;
        let filtersQueryString = [];

        return BaseController.extend("ordermanager.controller.SalesOrderSet", {
            onInit: function () {
                const oView = this.getView();
                const oMultiInput = oView.byId("multiInputSearch");
                const oModel = this.getOwnerComponent().getModel();
                const oStateModel = new JSONModel({
                    SalesOrderSet: [],
                    isShowLoadMoreBtn: false,
                    loadMoreIndicator: false,
                    totalTableLine: 0,
                    totalCurrentTableLine: 0
                });

                oMultiInput.addValidator(function ({ text }) {
                    const token = new Token({ key: text, text: text });
                    filtersQueryString.push(new Filter("SalesOrderID", FilterOperator.EQ, text))
                    return token;
                });

                oView.setModel(oStateModel, "customSalesOrderSet");
                oView.byId("tbSalesOrderSet")?.setBusy(true);

                // count BillingStatus
                COUNT_BILLING_STATUS.map(item =>
                    oModel.read("/SalesOrderSet/$count", {
                        filters: [new Filter("BillingStatus", FilterOperator.EQ, item.status)],
                        success: count => item.total = count
                    })
                )

                // count SaleOrderSet
                this.getOwnerComponent().getModel().read("/SalesOrderSet/$count", {
                    success: count => totalSaleOrderSet = count
                })
            },
            onAfterRendering: function () {

                const oView = this.getView();
                const oSalesOrderSet = oView.getModel('customSalesOrderSet');

                // get list orders for main table
                const skip = oView.getModel("config").getProperty("/SCREEN/SALES_ORDER_SET/PAGINATION_SKIP_BEGIN");
                this.getView().getModel().read("/SalesOrderSet", {
                    sorters: DEFAULT_SORTER,
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
                COUNT_BILLING_STATUS.forEach(o => {
                    if (o.status === oGroup.key) {
                        count = o.total;
                    }
                });
                return new sap.m.GroupHeaderListItem({
                    title: `${oGroup.key === '' ? "Billing Status empty" : oGroup.key} (${this.formatNumber(count)}) / total ${this.formatNumber(totalSaleOrderSet)}`
                });
            },
            handleValueHelp: function () {
                const oView = this.getView();
                const oInput = oView.byId("multiInputSearch");
                if (!this.oValueHelpDialog) {
                    this.oValueHelpDialog = new ValueHelpDialog("idValueHelp", {
                        supportRanges: true,
                        supportRangesOnly: true,
                        title: '   ',
                        ok: oEvent => {
                            const valuHelpTokens = oEvent.getParameter("tokens");
                            oInput.setTokens(valuHelpTokens);
                            this.oValueHelpDialog.close();
                        },
                        cancel: () => {
                            this.oValueHelpDialog.close();
                        }
                    })
                }

                //Creating Define Conditions 
                this.oValueHelpDialog.setRangeKeyFields([
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

                this.oValueHelpDialog.open();
            },

            applySearch: function () {
                const oView = this.getView();
                const oModel = oView.getModel();
                const oTable = oView.byId("tbSalesOrderSet");
                const oSalesOrderSet = oView.getModel('customSalesOrderSet');
                const aTokens = oView.byId("multiInputSearch").getTokens();
                console.log("aToken", aTokens)
                //Create Filter
                const aFilters = aTokens.map(function (oToken) {
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
                            path: "SalesOrderID",
                            operator: FilterOperator.EQ,
                            value1: aTokens[0].getKey()
                        });
                    }
                });
                oTable.setBusy(true)
                filtersQueryString = aFilters;

                current_skip = 0;
                loadMoreTopUserSelect = DEFAULT_LOAD_MORE_STEP;

                oModel.read("/SalesOrderSet", {
                    sorters: DEFAULT_SORTER,
                    filters: filtersQueryString,
                    urlParameters: {
                        $skip: current_skip,
                        $top: loadMoreTopUserSelect
                    },
                    success: ({ results }) => {
                        oTable.setBusy(false)
                        if (results.length) {
                            console.log(results)
                            oSalesOrderSet.setProperty(`/SalesOrderSet`, results);
                            oSalesOrderSet.setProperty(`/totalCurrentTableLine`, this.formatNumber(results.length));

                        } else {
                            oTable.setShowNoData(true)
                            oSalesOrderSet.setProperty(`/SalesOrderSet`, []);
                            MessageBox.error("Data not found!");
                        }
                        filtersQueryString = []

                    },
                    error: function () {
                        oTable.setBusy(false)
                        MessageBox.error("Error, please try again");
                        filtersQueryString = [];
                    },
                })


                oModel.read("/SalesOrderSet/$count", {
                    filters: filtersQueryString,
                    success: (count) => {
                        totalSaleOrderSet = count;
                        oSalesOrderSet.setProperty(`/totalTableLine`, this.formatNumber(totalSaleOrderSet));
                        // handle is show load more button
                        if (count < DEFAULT_LOAD_MORE_STEP) {
                            oSalesOrderSet.setProperty(`/isShowLoadMoreBtn`, false);
                        } else {
                            oSalesOrderSet.setProperty(`/isShowLoadMoreBtn`, true);
                        }
                    },
                })

                // re-count 
                COUNT_BILLING_STATUS.map(item =>
                    oModel.read("/SalesOrderSet/$count", {
                        filters: filtersQueryString,
                        success: count => totalSaleOrderSet = count
                    })
                )

                // re-count BillingStatus
                COUNT_BILLING_STATUS.map(item =>
                    oModel.read("/SalesOrderSet/$count", {
                        filters: [...filtersQueryString, new Filter("BillingStatus", FilterOperator.EQ, item.status)],
                        success: count => item.total = count
                    })
                )


            },

            onPressSalesOrderLineItemSet: function (SalesOrderID) {
                const oRouter = this.getOwnerComponent().getRouter();
                console.log(SalesOrderID)
                oRouter.navTo("SalesOrderLineItemSet", { SalesOrderID: SalesOrderID });
            },
            onChangeLoadMoreItem: function (event) {
                loadMoreTopUserSelect = Number(event.getParameters().selectedItem.getText());
            },

            onPressLoadMoreBtn: function () {
                const oView = this.getView();
                const oSalesOrderSet = oView.getModel('customSalesOrderSet');
                oSalesOrderSet.setProperty("/loadMoreIndicator", true);
                oView.getModel().read("/SalesOrderSet", {
                    sorters: DEFAULT_SORTER,
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
