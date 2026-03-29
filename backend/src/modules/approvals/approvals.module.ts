import { Module, forwardRef } from '@nestjs/common';
import { ApprovalsService } from './services/approvals.service';
import { ApprovalsController } from './controllers/approvals.controller';
import { ApprovalEngineService } from './services/approval-engine.service';
import { TemplateRoutingService } from './services/template-routing.service';
import { ApprovalChainBuilderService } from './services/approval-chain-builder.service';
import { ApprovalRuleEvaluatorService } from './services/approval-rule-evaluator.service';
import { ApprovalAuditService } from './services/approval-audit.service';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [forwardRef(() => ExpensesModule)],
  controllers: [ApprovalsController],
  providers: [
    ApprovalsService,
    ApprovalEngineService,
    TemplateRoutingService,
    ApprovalChainBuilderService,
    ApprovalRuleEvaluatorService,
    ApprovalAuditService,
  ],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
