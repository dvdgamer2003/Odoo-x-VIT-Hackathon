"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsModule = void 0;
const common_1 = require("@nestjs/common");
const approvals_service_1 = require("./services/approvals.service");
const approvals_controller_1 = require("./controllers/approvals.controller");
const approval_engine_service_1 = require("./services/approval-engine.service");
const template_routing_service_1 = require("./services/template-routing.service");
const approval_chain_builder_service_1 = require("./services/approval-chain-builder.service");
const approval_rule_evaluator_service_1 = require("./services/approval-rule-evaluator.service");
const approval_audit_service_1 = require("./services/approval-audit.service");
const expenses_module_1 = require("../expenses/expenses.module");
let ApprovalsModule = class ApprovalsModule {
};
exports.ApprovalsModule = ApprovalsModule;
exports.ApprovalsModule = ApprovalsModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => expenses_module_1.ExpensesModule)],
        controllers: [approvals_controller_1.ApprovalsController],
        providers: [
            approvals_service_1.ApprovalsService,
            approval_engine_service_1.ApprovalEngineService,
            template_routing_service_1.TemplateRoutingService,
            approval_chain_builder_service_1.ApprovalChainBuilderService,
            approval_rule_evaluator_service_1.ApprovalRuleEvaluatorService,
            approval_audit_service_1.ApprovalAuditService,
        ],
        exports: [approvals_service_1.ApprovalsService],
    })
], ApprovalsModule);
//# sourceMappingURL=approvals.module.js.map