sap.ui.define([
    "ordermanager/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
],

    function (BaseController, Filter, Sorter) {
        "use strict";

        let countBillingStatus = [{
            status: 'P',
            total: null
        },
        {
            status: '',
            total: null
        }];

        let totalSaleOrderSet = 0;
        const DEFAULT_LOAD_MORE_STEP = 50;

        return BaseController.extend("ordermanager.controller.SalesOrderSet", {
            onInit: function () {
                this.getView().byId("tbSalesOrderSet")?.setBusy(true);

                var oModel = new sap.ui.model.json.JSONModel({
                    SalesOrderSet: [],
                    isShowLoadMoreBtn: false,
                    loadMoreIndicator: false,
                    current_skip: 0,
                    loadMoreTopUserSelect: DEFAULT_LOAD_MORE_STEP,
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
                    success: (data) => {
                        //update main table
                        this.getView().byId("tbSalesOrderSet")?.setBusy(false);
                        this.getView().getModel('customSalesOrderSet').setProperty(`/SalesOrderSet`, data.results);
                        //show load more button
                        this.getView().getModel('customSalesOrderSet').setProperty(`/isShowLoadMoreBtn`, true);
                        this.getView().getModel('customSalesOrderSet').setProperty(`/current_skip`, DEFAULT_LOAD_MORE_STEP);
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
                this.getView().getModel('customSalesOrderSet').setProperty("/loadMoreTopUserSelect", Number(event.getParameters().selectedItem.getText()));
            },

            onPressLoadMoreBtn: function () {
                this.getView().getModel('customSalesOrderSet').setProperty("/loadMoreIndicator", true);
                console.log(this.getView().getModel('customSalesOrderSet').getProperty("/loadMoreTopUserSelect"));

                const current_skip = this.getView().getModel('customSalesOrderSet').getProperty("/current_skip");
                const loadMoreTopUserSelect = this.getView().getModel('customSalesOrderSet').getProperty("/loadMoreTopUserSelect");
                this.getView().getModel().read("/SalesOrderSet", {
                    sorters: [new Sorter("BillingStatus", true), new Sorter("SalesOrderID", true)],
                    urlParameters: {
                        $skip: current_skip,
                        $top: loadMoreTopUserSelect
                    },
                    success: (data) => {
                        this.getView().getModel('customSalesOrderSet').setProperty("/loadMoreIndicator", false);
                        this.getView().getModel('customSalesOrderSet').setProperty(`/current_skip`, current_skip + loadMoreTopUserSelect);
                        //update main table
                        const SalesOrderSet = this.getView().getModel('customSalesOrderSet').getProperty(`/SalesOrderSet`);
                        this.getView().getModel('customSalesOrderSet').setProperty(`/SalesOrderSet`, [...SalesOrderSet, ...data.results]);
                        //show load more button
                        // this.getView().getModel('customSalesOrderSet').setProperty(`/isShowLoadMoreBtn`, true);
                    }
                })
            }

        });
    });
