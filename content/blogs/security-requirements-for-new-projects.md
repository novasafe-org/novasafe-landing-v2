# Security Requirements for New Projects

Security is easier to build into a project than to retrofit after launch. But it can be difficult to know where to start, especially when requirements are incomplete or a team has limited security experience.

A practical process begins by understanding what the project does and what it must protect. Then you turn those risks into specific, testable requirements, assign owners, and verify the controls before release. This guide explains that workflow for authorized projects, whether you are building an application, launching a service, or introducing a new internal system.

## What are security requirements?

Security requirements describe the protections a project must provide. They may cover how users sign in, how data is stored, how access is restricted, or how incidents are detected and handled.

Good requirements are specific enough to verify. For example, “the application must be secure” is too broad to test. A more useful requirement is: “The application must require multifactor authentication for administrator accounts.” The project team can confirm whether that control is in place and record evidence.

Security requirements are not limited to software. They can also apply to infrastructure, vendors, operational procedures, data handling, and support processes.

## A practical workflow for new projects

### 1. Define the project and its authorized scope

Start by documenting what is being built, who will use it, and what is included in the security review. Note the environments involved, such as development, testing, and production, as well as any connected services or third-party systems.

Agree on the scope before testing. For example, you might be authorized to review the project’s source code and staging environment, but not a vendor’s production service. Do not scan or test systems outside the scope you have permission to assess.

Record key details such as:

- Project owner and technical contact
- Main features and user roles
- Systems, repositories, and environments in scope
- External services and dependencies
- Planned launch date and review milestones
- Known constraints, such as regulatory or contractual obligations

### 2. Identify data, users, and important assets

List the information the project will create, receive, process, or store. Consider how sensitive it is and what could happen if it were exposed, changed without authorization, or unavailable.

Assets might include account credentials, personal information, payment data, business records, source code, signing keys, or service availability. Note where data comes from, where it goes, and which components can access it. A simple data-flow diagram can reveal overlooked copies, integrations, and trust boundaries.

For each important asset, ask:

- What is the impact if it is disclosed, altered, or lost?
- Which users or services need access?
- How long must it be retained?
- Is it sent to a third party or across a network?

Use the answers to guide the project’s security requirements. Avoid collecting or retaining data the project does not need.

### 3. Identify threats and prioritize risks

A threat model is a structured way to consider how the project might be misused or attacked. You do not need a complex tool to begin. For each important feature or data flow, ask what could go wrong, who might cause it, and what the impact would be.

For an application with user accounts, plausible scenarios might include:

- An attacker guesses or reuses a user’s password.
- A user accesses another user’s records by changing an identifier.
- A developer accidentally commits a credential to the repository.
- A compromised dependency introduces vulnerable code.
- An outage prevents users from accessing a critical service.

Prioritize scenarios using the sensitivity of the affected data, the potential impact, and how exposed the feature is. Treat this as a planning aid, not a guarantee that every threat has been found. Revisit the assessment when the design or scope changes.

### 4. Write clear, testable requirements

Turn prioritized risks into requirements that describe an expected outcome. Assign each requirement an owner, a way to verify it, and a point in the project when it must be met.

| Area | Example requirement | Example validation evidence |
|---|---|---|
| Authentication | Administrator accounts must use multifactor authentication. | Configuration review and an authorized sign-in test. |
| Authorization | Users must only be able to view and modify records they are permitted to access. | Role-based tests, including attempts to access another test user’s record. |
| Data protection | Sensitive data must be encrypted in transit using current, supported transport security. | Configuration review and a scan of the authorized test endpoint. |
| Secrets | Credentials and keys must not be stored in source control. | Secret-scanning results and a review of secret-storage practices. |
| Dependencies | The project must identify known vulnerable dependencies and document remediation or an approved exception. | Dependency scan, review, and tracked findings. |
| Logging | Security-relevant events must be recorded without exposing passwords, tokens, or unnecessary personal data. | Log review using test accounts and sample events. |
| Recovery | The team must document how to restore required data and services. | A recorded recovery exercise or other agreed evidence. |

The right requirements depend on the project. Apply relevant organizational policies, contracts, and legal obligations, and get qualified advice where the project handles regulated or especially sensitive information.

### 5. Assign ownership and define release criteria

A requirement without an owner is easy to miss. Assign responsibility to a role or named team, such as the application owner, platform team, or security reviewer. Set a due date or milestone and agree what evidence will demonstrate completion.

Define how findings will be handled before testing begins. For example, decide which issues block release, who can approve an exception, and how an exception will be documented and reviewed. Record the affected asset, rationale, compensating controls, approver, and expiration or review date. An exception should not silently become a permanent fix.

### 6. Validate requirements in authorized environments

Validation should match the requirement. Use code review, configuration checks, automated analysis, and manual tests as appropriate. Begin in development or staging where possible, using test accounts and non-production data. Confirm that testing is approved and will not disrupt services or expose real user information.

For example, a project using Node.js can check its dependencies from the project directory with:

```bash
npm audit
```

A Python project with a dependency file can use a dependency auditing tool such as `pip-audit`:

```bash
pip-audit -r requirements.txt
```

These checks can identify reported dependency issues, but they do not prove that an application is secure. Review findings to confirm whether they affect the project, assess available fixes, and test updates. Use tools approved by your organization and follow their installation and usage guidance.

Other useful validation activities include:

- Reviewing access-control logic and testing different user roles.
- Checking infrastructure and application configuration against approved baselines.
- Scanning code and dependencies with approved tools.
- Testing the application in an authorized staging environment.
- Inspecting logs to confirm useful security events are captured without sensitive values.
- Reviewing backup and recovery procedures with the people responsible for operations.

Keep records of the test scope, date, tool or method, results, and any limitations. Protect those records if they contain sensitive system details.

### 7. Remediate findings and verify fixes

For each finding, record what is affected, its potential impact, the owner, the planned fix, and the target date. Prioritize issues based on risk and exposure rather than treating every alert as equally urgent. If a fix cannot be applied immediately, document an approved, time-bound exception and any temporary risk-reduction measures.

After remediation, repeat the relevant validation. A change is not verified just because a ticket is marked complete. For example, after correcting an authorization flaw, repeat the test that previously showed one user could access another user’s record. Confirm that the fix works and has not broken the intended user experience.

Also consider whether the same cause exists in other features. A single access-control issue may point to a shared design or testing gap that should be addressed across the project.

## A simple security requirements checklist

Before launch, confirm that the project team has:

- Defined the authorized scope and identified key systems and data.
- Considered important threats and prioritized risks.
- Documented security requirements with owners and validation methods.
- Reviewed authentication, authorization, data handling, dependencies, and secrets.
- Tested relevant controls in an approved environment.
- Tracked findings through remediation or documented approval of exceptions.
- Re-tested fixes and recorded evidence.
- Assigned responsibility for ongoing updates, monitoring, and incident response.

This checklist is a starting point, not a substitute for requirements that apply to a particular organization, industry, or system.

## Common mistakes to avoid

- **Using vague wording:** Requirements such as “use strong security” are difficult to implement and verify. State the expected behavior and how it will be checked.
- **Waiting until launch:** Late reviews leave less time to make design changes. Identify security needs during planning and revisit them as the project evolves.
- **Relying only on automated scans:** Scanners can miss design problems and produce findings that require context. Combine tools with review and appropriate testing.
- **Testing outside authorization:** Keep scans and tests within the agreed scope, and avoid actions that could affect production or other people’s systems.
- **Closing findings without retesting:** Verify that the fix resolves the original issue and check for related weaknesses.
- **Ignoring operational ownership:** Security continues after release. Decide who handles updates, access reviews, alerts, backups, and incident escalation.

## FAQ

### When should security requirements be written?

Start during project planning, before key design decisions are difficult to change. Review the requirements when the scope, data, integrations, or deployment model changes.

### Who is responsible for security requirements?

Responsibility is shared. Project and product owners explain the business needs; developers and operations teams implement and maintain controls; security specialists can advise on risk and validation. Assign a clear owner to every requirement.

### How many security requirements does a project need?

There is no universal number. Include requirements that address the project’s data, users, architecture, threats, and applicable obligations. Prioritize clear, relevant requirements over a long list that no one can validate.

### Can automated tools confirm that a project is secure?

No single scan can establish that a project is secure. Automated tools can help find certain issues, such as vulnerable dependencies or code patterns, but teams must review results and validate important behavior in context.

## Conclusion

Evaluating security requirements for new projects is a repeatable process: define the authorized scope, understand the data and risks, write testable requirements, assign owners, validate controls, and track remediation through retesting. Starting early makes it easier to address security as part of the design and delivery process rather than as a last-minute launch hurdle.

Keep the requirements practical and tied to the project’s actual risks. As the project changes, revisit them so the controls and evidence continue to match what is being built and operated.
