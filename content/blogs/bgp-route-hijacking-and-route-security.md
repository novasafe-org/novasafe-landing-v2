# BGP Route Hijacking and Route Security

The Border Gateway Protocol (BGP) lets networks around the world exchange information about which IP address prefixes they can reach. That system depends on networks announcing routes and other networks deciding whether to accept and propagate them. When an announcement is false, misconfigured, or accepted without adequate checks, traffic can be redirected, intercepted, or blackholed.

No single control solves every BGP security problem. Resource Public Key Infrastructure (RPKI) Route Origin Validation (ROV), route filters, monitoring, and path-validation mechanisms address different risks and have different operational costs. This guide explains those differences and offers practical criteria for choosing a defensive design.

## What is a BGP route hijack?

A BGP route announcement says that an autonomous system (AS) can deliver traffic to a particular IP prefix. Other networks use BGP policy to select and propagate paths to that prefix. A **route hijack** occurs when an AS announces a prefix it is not authorized to originate, or otherwise causes traffic to follow an unintended path.

For example, suppose AS64496 legitimately originates `203.0.113.0/24`. If AS64497 announces the same prefix without authorization, networks may accept either route and select one based on their routing policies. If the unauthorized announcement is a more-specific prefix, such as `203.0.113.0/25`, some networks may prefer it because longest-prefix matching favors the narrower route. The result can be partial or widespread traffic diversion or loss.

These AS numbers and IP addresses are reserved for documentation; the example illustrates the mechanics, not a real incident.

A hijack can be malicious, but not every bad announcement is deliberate. Common causes include configuration errors, incorrect prefix filters, and mistaken routing policy.

## Hijacks, route leaks, and other failures

The terms describe related but distinct problems:

- **Origin hijack:** An AS originates a prefix it is not authorized to announce.
- **More-specific hijack:** An unauthorized AS announces a narrower prefix within a legitimate allocation, potentially attracting traffic for part of it.
- **Route leak:** An AS propagates a route beyond its intended scope or contrary to its routing policy. The route may have a legitimate origin, but the propagation can still send traffic along an unintended path.
- **Misconfiguration:** A route may be announced or propagated incorrectly without an attacker being involved.

This distinction matters because a control designed to check who originated a prefix may not detect a route leak involving an otherwise authorized origin. A strong networking security program combines controls rather than treating all BGP incidents as the same problem.

## Why BGP route security is challenging

BGP was designed to exchange reachability information between independently operated networks. Each network applies its own routing policy, and there is no universal authority that approves every route in real time. AS-path information provides useful context, but by itself it does not cryptographically prove that every path element is truthful.

A defensive design therefore needs to address several questions:

1. Is the announcing AS authorized to originate this prefix?
2. Is the prefix within the range the network expects from this peer?
3. Is the route being propagated according to the relationship and policy between networks?
4. Will operators notice an unexpected announcement quickly enough to respond?

## Main approaches to route security

### RPKI and Route Origin Validation

RPKI is a system for publishing cryptographically verifiable statements about Internet number resources. A Route Origin Authorization (ROA) identifies a prefix, an origin AS, and an optional maximum prefix length. A network can use validated ROA data to classify a BGP route according to **Route Origin Validation**:

- **Valid:** The route's prefix and origin AS are authorized by a covering ROA, and the route length is permitted.
- **Invalid:** A covering ROA exists, but the origin AS is not authorized, or the route is more specific than the permitted maximum length.
- **NotFound:** No covering ROA is available to assess the route.

ROV checks the route origin, not every AS in the path. It can help prevent acceptance of many origin hijacks, but it does not prove that the complete AS path is legitimate or detect every route leak.

#### Example

Suppose the owner of `203.0.113.0/24` publishes a ROA authorizing AS64496 with a maximum length of `/24`. A route for that prefix originated by AS64496 is Valid. A route for the same prefix originated by AS64497 is Invalid. A route for `203.0.113.0/25` is also Invalid under that ROA because the ROA does not permit a more-specific announcement.

#### ROA design and operational tradeoffs

ROAs are effective only when they accurately reflect intended announcements. An incorrect origin AS or overly restrictive maximum length can make legitimate routes Invalid. An overly permissive maximum length can authorize more-specific routes that the resource holder did not intend to allow.

Before changing ROAs, inventory all legitimate origin ASes and prefix lengths, including backup and traffic-engineering announcements. Keep that information current when providers, allocations, or routing designs change. Monitor ROA publication and validation status as part of normal change management.

Networks commonly reject RPKI Invalid routes while continuing to accept NotFound routes under other policy checks. This approach limits the impact of invalid announcements without treating the absence of a ROA as proof of wrongdoing. The right policy depends on the network's role, risk tolerance, and operational readiness.

### Prefix filtering and routing policy

Prefix filters constrain which routes a neighbor can announce. For customer sessions, a provider can permit only the prefixes the customer is expected to originate. For peer and provider sessions, operators can apply filters and routing policies appropriate to the relationship and network role.

Good filters should be based on current, authoritative configuration data, reviewed when relationships or address usage change, and applied consistently to both IPv4 and IPv6 where relevant. A filter that is too broad may allow unauthorized routes; one that is too narrow may block legitimate announcements during a planned change or failover.

A **maximum-prefix limit** can protect a router from unexpectedly large route volumes, but it is not a substitute for prefix authorization. Configure thresholds with room for expected growth and use alerts or staged actions where supported. An abrupt session shutdown may protect the router while also disrupting connectivity, so the response should match the operational risk.

### IRR-based filters

Internet Routing Registry (IRR) data can help build prefix filters by recording routing objects and related information. These records are widely used in operational workflows, but their accuracy and maintenance vary. A filter generated from stale or unverified IRR data can either permit an unauthorized route or block a legitimate one.

Treat IRR data as an input to a controlled filtering process, not as unquestionable proof of authorization. Validate data sources, review generated changes, and compare expected routes against other authoritative records where possible.

### Monitoring and alerting

Monitoring helps operators detect unexpected announcements, origin changes, route leaks, and changes in path or reachability. Useful signals include:

- A previously unseen origin AS for an important prefix.
- An announcement of a more-specific prefix than expected.
- A route that becomes RPKI Invalid.
- A sudden increase in routes received from a neighbor.
- Unexpected changes in AS paths or traffic reachability.

Monitoring does not prevent a bad route from propagating, but it can shorten detection and response time. Pair alerts with clear ownership, escalation paths, and a process for verifying whether an announcement is an attack, an error, or an authorized change.

### BGP Roles, OTC, and route-leak controls

BGP Roles and the Only-to-Customer (OTC) attribute support policy signaling intended to help detect or prevent certain route leaks between participating networks. These mechanisms address aspects of propagation policy rather than simply checking whether an AS is authorized to originate a prefix. Their value depends on compatible implementations, correct configuration, and adoption by the relevant networks.

Relationship-based import and export policies remain important even when signaling is available. Do not assume that a protocol attribute replaces careful policy design or operational coordination with peers and providers.

### BGPsec and AS-path validation

BGPsec is designed to provide cryptographic validation of AS-path information for participating networks. It aims to make it harder to forge path information, but it does not replace origin authorization, prefix filtering, or routing policy. Its operational value also depends on deployment and support across the path being evaluated.

AS-path validation can be relevant when the threat model includes forged path information. For many operators, ROV, sound filters, and monitoring are more immediately deployable controls. Evaluate BGPsec in the context of actual peer support, implementation capability, operational complexity, and the specific risks it is intended to reduce.

## Comparing the approaches

| Approach | Primarily helps with | Key limitation | Operational consideration |
|---|---|---|---|
| RPKI ROV | Unauthorized origin ASes and unauthorized prefix lengths | Does not validate the full path or catch every leak | Keep ROAs accurate and validation data available |
| Prefix filters | Routes outside an expected prefix policy | Depends on correct, current filter data | Maintain and review filters as relationships change |
| IRR data | Building route filters and documenting routing intent | Record quality and freshness vary | Validate sources and review generated policy |
| Monitoring | Detecting unexpected route or path changes | Detection alone does not block propagation | Define alert ownership and response procedures |
| BGP Roles and OTC | Some relationship-policy route leaks | Requires support and correct configuration | Coordinate policy with participating neighbors |
| BGPsec | Forged AS-path information among participating networks | Does not replace other controls; deployment matters | Assess support and operational cost against the threat model |

## A practical defensive design

Use the following sequence to build or improve a route security program:

1. **Inventory your routes and relationships.** Record prefixes, origin ASes, intended prefix lengths, transit providers, peers, customers, and backup paths. Include IPv4 and IPv6.
2. **Publish and review ROAs.** Authorize every legitimate origin and only the prefix lengths that are required. Check for accidental gaps, conflicting authorizations, and changes that could make a legitimate route Invalid.
3. **Enable ROV at ingress.** Establish a policy for Valid, Invalid, and NotFound routes. Many operators reject Invalid routes and handle NotFound routes using other policy checks. Test policy changes and provide a way to diagnose unexpected rejection.
4. **Apply neighbor-specific filters.** Permit only routes consistent with each customer's, peer's, or provider's expected announcements and the network's routing policy. Use reviewed data sources and controlled updates.
5. **Set sensible route-volume limits.** Configure maximum-prefix protections and alerts based on expected route volumes. Avoid treating a route-count limit as a prefix authorization mechanism.
6. **Add monitoring and response procedures.** Alert on unexpected origins, more-specific announcements, Invalid status changes, and unusual route-volume or path changes. Document how to confirm and escalate an event.
7. **Review propagation policy.** Where supported by your network and neighbors, assess BGP Roles and OTC or other route-leak controls. Keep import and export policies explicit.
8. **Test changes and rehearse incidents.** Use lab or staged validation where possible. Confirm that legitimate failover routes remain reachable and that staff know how to investigate and communicate during an incident.

### Example policy logic

The following is vendor-neutral pseudocode, not a router configuration. Apply local routing policy and test implementation-specific syntax before deployment:

```text
for each received BGP route:
    if route is RPKI Invalid:
        reject or quarantine according to documented policy
    else if route violates the neighbor's prefix or relationship policy:
        reject
    else if route exceeds the neighbor's configured route-volume limit:
        alert or apply the documented protective action
    else:
        process using normal routing policy
```

The order and action can differ by network. In particular, a route's RPKI state should be one input to policy, not a replacement for neighbor-specific authorization and propagation rules.

## Common pitfalls

- **Publishing an inaccurate ROA:** A legitimate route can become Invalid if the origin AS or maximum length is wrong.
- **Allowing excessive more-specifics:** Setting a maximum length broader than operationally necessary expands what the ROA authorizes.
- **Rejecting all NotFound routes without planning:** Many valid routes have no ROA. A strict policy can create reachability problems if applied without assessing coverage and exceptions.
- **Assuming ROV prevents route leaks:** ROV evaluates origin authorization; it does not validate the complete business relationship or intended propagation path.
- **Trusting an IRR-generated filter without review:** Incorrect or stale registry data can produce unsafe or disruptive policy.
- **Using maximum-prefix limits as the only filter:** Route-count protection does not confirm that individual prefixes are authorized.
- **Ignoring the response process:** An alert without an owner, verification procedure, and escalation path may not lead to timely action.

## Choosing the right defense

For most networks, the practical starting point is accurate ROAs, ROV at route ingress, explicit prefix and relationship filters, and monitoring. These controls complement one another: ROV checks origin authorization, filters constrain what a neighbor may announce, and monitoring helps identify unexpected changes.

The appropriate design depends on your network's role and resources. A network accepting customer routes may need especially precise customer prefix filters. A network with many peers may prioritize repeatable policy automation and change review. An operator seeking additional protection against route leaks should assess relationship-based controls and coordination with neighbors. Consider BGPsec when its path-validation properties address a defined risk and the required implementation and peer support are available.

Evaluate each control against four criteria: **which failure it addresses, what it does not address, what data or deployment it depends on, and what happens when it fails or is misconfigured**. That makes tradeoffs explicit and helps avoid treating one security mechanism as a complete solution.

## FAQ

### Does RPKI stop every BGP route hijack?

No. ROV helps identify routes whose origin AS or prefix length is not authorized by the available ROAs. It does not validate every AS in the path, and it does not detect every route leak. Combine it with prefix filters, routing policy, and monitoring.

### Should a network reject RPKI NotFound routes?

NotFound means no covering ROA is available for the route; it does not mean the route is unauthorized. Many networks accept NotFound routes subject to other policy checks while rejecting Invalid routes. A stricter policy requires careful assessment of route coverage, exceptions, and potential reachability effects.

### Can a route leak happen when the origin is legitimate?

Yes. A route leak can involve a correctly originated route that is propagated beyond its intended scope or contrary to the network's policy. Origin validation alone does not establish that the route's propagation is appropriate.

### Are IRR filters and RPKI alternatives?

They are different sources of routing information and can be used together. RPKI ROAs support cryptographic origin validation, while IRR records can help build filters. Both require operational care: ROAs must match intended announcements, and IRR data should be checked for accuracy and freshness.

## Conclusion

BGP route hijacking and route leaks exploit different weaknesses in how networks authorize and propagate reachability information. RPKI ROV is a valuable defense against many unauthorized-origin announcements, but it is not a complete route-security system. Pair it with accurate prefix filters, deliberate routing policy, monitoring, and a tested response process. Consider relationship-based leak controls and AS-path validation where they fit your threat model and deployment environment.
