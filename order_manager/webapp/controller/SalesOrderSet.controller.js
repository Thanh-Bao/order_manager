sap.ui.define([
    "ordermanager/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
],

    function (BaseController, Filter, Sorter) {
        "use strict";

        const DEFAULT_LOAD_MORE_STEP = 50;

        let countBillingStatus = [{
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
        let filtersQueryString = null;

        return BaseController.extend("ordermanager.controller.SalesOrderSet", {
            onInit: function () {
                this.getView().byId("tbSalesOrderSet")?.setBusy(true);

                var oModel = new sap.ui.model.json.JSONModel({
                    SalesOrderSet: [],
                    isShowLoadMoreBtn: false,
                    loadMoreIndicator: false,
                    totalTableLine: 0,
                    totalCurrentTableLine: 0
                });
                this.getView().setModel(oModel, "customSalesOrderSet");

                // count BillingStatus
                countBillingStatus.map(item => {
                    this.getOwnerComponent().getModel().read("/SalesOrderSet/$count", {
                        filters: [new Filter("BillingStatus", "EQ", item.status)],
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

                // get list orders for main table
                const skip = this.getView().getModel("config").getProperty("/SCREEN/SALES_ORDER_SET/PAGINATION_SKIP_BEGIN");
                this.getView().getModel().read("/SalesOrderSet", {
                    sorters: [new Sorter("BillingStatus", true), new Sorter("SalesOrderID", true)],
                    urlParameters: {
                        $skip: skip,
                        $top: DEFAULT_LOAD_MORE_STEP
                    },
                    success: ({ results }) => {
                        //update main table
                        this.getView().byId("tbSalesOrderSet")?.setBusy(false);
                        this.getView().getModel('customSalesOrderSet').setProperty(`/SalesOrderSet`, results);
                        //show load more button
                        this.getView().getModel('customSalesOrderSet').setProperty(`/isShowLoadMoreBtn`, true);
                        // count table line
                        this.getView().getModel('customSalesOrderSet').setProperty(`/totalTableLine`, this.formatNumber(totalSaleOrderSet));
                        this.getView().getModel('customSalesOrderSet').setProperty(`/totalCurrentTableLine`, this.formatNumber(results.length));
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
            searchTyping: function (event) {
                console.log(event.getParameters().value)
                let oModel = this.getView()
                this.getView().getModel().read("/SalesOrderSet", {
                    filters: [new Filter("SalesOrderID", "EQ", "0500000001")],
                    success: function (SalesOrderSet) {
                        console.log(SalesOrderSet)
                        let oTable = oModel.byId("tbSalesOrderSet");
                        console.log(oTable)
                    },
                    error: function (error) {
                        console.log(error);
                    }
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
                this.getView().getModel('customSalesOrderSet').setProperty("/loadMoreIndicator", true);

                this.getView().getModel().read("/SalesOrderSet", {
                    sorters: [new Sorter("BillingStatus", true), new Sorter("SalesOrderID", true)],
                    urlParameters: {
                        $skip: current_skip,
                        $top: loadMoreTopUserSelect
                    },
                    filters: filtersQueryString,
                    success: ({ results }) => {
                        this.getView().getModel('customSalesOrderSet').setProperty("/loadMoreIndicator", false);
                        //update main table
                        const SalesOrderSet = this.getView().getModel('customSalesOrderSet').getProperty(`/SalesOrderSet`);
                        this.getView().getModel('customSalesOrderSet').setProperty(`/SalesOrderSet`, [...SalesOrderSet, ...results]);
                        this.getView().getModel('customSalesOrderSet').setProperty(`/totalCurrentTableLine`, this.formatNumber(current_skip + results.length));

                        current_skip += loadMoreTopUserSelect;
                        //show load more button
                        // this.getView().getModel('customSalesOrderSet').setProperty(`/isShowLoadMoreBtn`, true);
                    }
                })
            }

        });
    });
