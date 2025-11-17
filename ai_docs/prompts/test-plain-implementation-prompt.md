# Implementing the Test Plan

Your task is to implement the test plan exactly as outlined in the documentation.

## Instructions

- Make sure you read files in ai_docs/test-plan/ directory on
  need to know bases, don't do anything blindly.
- Don't read files outside ai_docs/test-plan/ directory
  unless explicitly instructed to do so.
- Only read files in ai_docs/test-plan/ 
- Implement stages sequentially step-by-step, first stage 1, and only when really finished and double-checked by sub-agent, only then start with stage 2, and so on.

## Workflow

- First, read @ai_docs/test-plan/test-plan-summary.md and ai_docs/test-plan/README.md.
- Make sure you understand the overall test plan and outcome expected.
- Then proceed to implement each stage as per the test plan.
- After completing each stage, briefly document your actions and results in the respective stage report file in ai_docs/test-plan/ directory.
- Once stage N is completed and brief report is documented, then create a varification prompt for sub-agent to verify the completion of stage N.
- Make sub-agent write to the same report file.
- Only after receiving confirmation from sub-agent that stage N is verified as complete, proceed to stage N+1.
- IMPORTANT: Sub-agent only verifies, it does not fix or change any code, it only appends their verification to the report file. If sub-agent recommends changes, you have to implement those changes and then append your comment to the same report file for verification again. And then again wait for sub-agent verification of the stage N. Only after sub-agent verification, proceed to next stage N+1.
- Continue this process until all stages in the test plan are completed and verified.
- Finally, compile a hi-level report summarizing the entire implementation process, challenges faced, solutions implemented, and final outcomes. Save this report as ai_docs/test-plan/final-report.md.
