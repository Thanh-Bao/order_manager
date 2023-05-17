sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/f/library",
    "sap/ui/core/UIComponent"
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, fioriLibrary, UIComponent) {
    "use strict";

    return Controller.extend("ordermanager.controller.SalesOrderLineItemSet", {
        onInit: function () {

            UIComponent.getRouterFor(this).attachRouteMatched(this.routeMatched, this);
            this.oView = this.getView();
            this._bDescendingSort = false;
            this.oProductsTable = this.oView.byId("tbSalesOrderLineItemSet");

            const oStateModel = new JSONModel({
                SalesOrderLineItemSet: [],
                SalesOrderSet: null,
                ToBusinessPartner: null,
                ProductDetail: null,
                isEnableButton: {
                    confirm: false,
                    issue: false,
                    invoice: false,
                    cancel: true
                }
            });


            this.getView().setModel(oStateModel, "customSalesOrderLineItemSet");
        },

        routeMatched: function (oEvent) {
            const SalesOrderID = oEvent.getParameter("arguments").SalesOrderID;
            const oView = this.getView();
            const oTable = oView.byId("tbSalesOrderLineItemSet");
            const oModel = oView.getModel();
            const oSalesOrderSet = oView.getModel('customSalesOrderLineItemSet');

            oTable.setBusy(true);

            oModel.read(`/SalesOrderSet('${SalesOrderID}')`, {
                success: results => {
                    oSalesOrderSet.setProperty(`/SalesOrderSet`, results);
                    switch (results.DeliveryStatus) {
                        case 'D':
                            oSalesOrderSet.setProperty("/isEnableButton/invoice", true);
                            break;

                        default:
                            break;
                    }
                },
                error: function () {
                    oSalesOrderSet.setProperty("/SalesOrderSet", null);
                }
            })
            // Product List
            oModel.read(`/SalesOrderSet('${SalesOrderID}')/ToLineItems`, {
                urlParameters: {
                    $expand: "ToProduct"
                },
                success: ({ results }) => {
                    oTable.setBusy(false)
                    oSalesOrderSet.setProperty(`/SalesOrderLineItemSet`, results);
                },
                error: function () {
                    oTable.setBusy(false)
                    oSalesOrderSet.setProperty("/SalesOrderLineItemSet", []);
                }
            })

            // Partner
            oModel.read(`/SalesOrderSet('${SalesOrderID}')/ToBusinessPartner`, {
                urlParameters: {
                    $expand: "ToContacts"
                },
                success: partner => {
                    oTable.setBusy(false)
                    oSalesOrderSet.setProperty(`/ToBusinessPartner`, partner);
                },
                error: function () {
                    oTable.setBusy(false)
                    oSalesOrderSet.setProperty("/ToBusinessPartner", []);
                }
            })

        },

        onSearch: function (oEvent) {
            var oTableSearchState = [],
                sQuery = oEvent.getParameter("query");

            if (sQuery && sQuery.length > 0) {
                oTableSearchState = [new Filter("ProductID", FilterOperator.Contains, sQuery)];
            }

            this.oProductsTable.getBinding("items").filter(oTableSearchState, "Application");
        },

        onSort: function () {
            this._bDescendingSort = !this._bDescendingSort;
            var oBinding = this.oProductsTable.getBinding("items"),
                oSorter = new Sorter("ItemPosition", this._bDescendingSort);

            oBinding.sort(oSorter);
        },
        onListItemPress: function (ProductID) {
            console.log(ProductID)
            const oView = this.getView();
            oView.byId("dialogProductInfo").open();
            oView.getModel().read(`/ProductSet('${ProductID}')`, {

                success: product => {
                    oView.getModel('customSalesOrderLineItemSet').setProperty(`/ProductDetail`, product);
                },
                error: function () {

                }
            })
        },
        dialogProductDetailClose: function () {
            this.getView().byId("dialogProductInfo").close();

        }
    });
});