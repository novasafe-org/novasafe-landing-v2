# Network Flow Logs for Threat Hunting

Network flow logs offer a useful way to ask what communicated across your network, when, and how much data moved. They can help threat hunters spot unusual destinations, unexpected services, scanning behavior, and possible command-and-control patterns—without requiring access to packet payloads.

Flow records are not a complete account of network activity, however. Their fields and coverage vary by platform, and a suspicious connection is a lead to investigate, not proof of compromise. This guide presents a practical workflow for evaluating network flow logs for threat hunting in an authorized environment, validating findings with other evidence, and taking proportionate remediation steps.

## What network flow logs contain

A network flow record summarizes traffic between endpoints over a period of time or for a defined connection. Depending on the collector and network device, a record may include:

- Source and destination IP addresses
- Source and destination ports
- Transport protocol, such as TCP or UDP
- Start and end times, or a timestamp and duration
- Packet and byte counts
- Ingress and egress interfaces or network zones
- Connection state, direction, or an allow/deny action
- Sampling, exporter, or observation-point details

Common sources include NetFlow and IPFIX exporters, cloud-provider flow logs, firewall traffic logs, and network monitoring tools such as Zeek. These sources are not interchangeable: a cloud flow record may describe traffic observed at a virtual network interface, while a firewall log may include policy decisions and a Zeek connection record may include connection-state information.

Flow logs generally describe metadata rather than application content. They may show that a host sent data to an external IP over TCP port 443, but not what that data contained. Encryption, sampling, collection gaps, NAT, and asymmetric routing can further limit what a record reveals.

## A practical workflow for threat hunting

### 1. Define scope and authorization

Before searching, establish which systems, networks, time ranges, and data sources are in scope. Confirm that your role authorizes access to the logs and any related endpoint or identity data. Follow internal retention, privacy, and incident-handling policies.

Write down the question you intend to answer. For example:

- Did a server communicate with a newly observed external destination?
- Did a workstation make repeated connections at regular intervals?
- Did an internal host scan many destination ports?
- Did a device transfer an unusual volume of data outside its expected operating pattern?

A focused question is easier to test than a broad search for anything unusual.

### 2. Check coverage and data quality

Before interpreting results, verify what the logs can actually show. Check:

- Which network segments and interfaces are monitored
- Whether records are sampled, delayed, dropped, or retained for only part of the investigation window
- Whether timestamps use UTC or local time and whether clocks are synchronized
- Whether source and destination fields reflect addresses before or after NAT
- Whether direction and action fields are consistently populated
- Whether byte and packet counts represent both directions or only one
- Whether IPv6 traffic is included

A missing record does not establish that a connection did not happen. Document collection gaps and limitations as part of the hunt.

### 3. Normalize the fields you need

Map source-specific fields into a consistent schema before comparing sources. A simple normalized record might contain:

| Field | Meaning |
|---|---|
| `start_time` | Connection start or observation time in a consistent timezone |
| `src_ip`, `src_port` | Initiating or observed source endpoint |
| `dst_ip`, `dst_port` | Destination endpoint |
| `protocol` | Transport protocol, such as TCP or UDP |
| `bytes_out`, `bytes_in` | Directional byte counts, if available |
| `packets` | Packet count, if available |
| `action` | Allow, deny, or another source-specific disposition |
| `sensor` | Collector, interface, or observation point |

Do not assume that `src_ip` always means the original client. Confirm how the source defines direction, particularly for bidirectional records, NAT, and cloud networking.

### 4. Establish a baseline

Unusual activity is easier to identify when you know what is normal for the environment. Compare activity across suitable time windows and group by meaningful attributes, such as asset role, subnet, destination, port, and time of day.

Useful baseline questions include:

- Which external destinations do servers in this role contact regularly?
- Which services and ports are expected for this subnet?
- How many distinct destinations does a typical endpoint contact?
- Are scheduled jobs, software updates, backups, or vulnerability scans creating predictable spikes?

Use asset inventory, ownership records, and change schedules to add context. A destination that is new for one host may be normal for another.

### 5. Search for behavior that supports a hypothesis

Start with patterns that can be expressed in your data, then treat matches as leads for validation. The following generic SQL illustrates common approaches. Adapt table names, field names, time syntax, and functions to your platform.

**Rare external destinations**

```sql
SELECT
  src_ip,
  dst_ip,
  dst_port,
  COUNT(*) AS connections,
  SUM(bytes_out) AS total_bytes_out
FROM network_flows
WHERE start_time >= CURRENT_TIMESTAMP - INTERVAL '24' HOUR
  AND is_internal(dst_ip) = FALSE
GROUP BY src_ip, dst_ip, dst_port
HAVING COUNT(*) <= 3
ORDER BY total_bytes_out DESC;
```

A rarely seen destination may be benign, such as a new software service, or worth investigating. Enrich it with asset ownership, DNS records, proxy or firewall data, and approved threat-intelligence sources. Reputation alone is not sufficient to confirm malicious activity.

**Repeated connections that may merit beaconing analysis**

Group a host’s connections to the same destination into time buckets and look for repeated activity. For example, an adaptable query could group records by source, destination, port, and five-minute window:

```sql
SELECT
  src_ip,
  dst_ip,
  dst_port,
  FLOOR_TO_INTERVAL(start_time, INTERVAL '5' MINUTE) AS time_bucket,
  COUNT(*) AS connections
FROM network_flows
WHERE start_time >= CURRENT_TIMESTAMP - INTERVAL '24' HOUR
GROUP BY src_ip, dst_ip, dst_port, time_bucket
HAVING COUNT(*) > 1
ORDER BY src_ip, dst_ip, time_bucket;
```

Regular timing can be a clue, but legitimate monitoring agents and business applications also connect on schedules. Examine the actual intervals over a longer window and compare the endpoint with peers of the same role.

**Possible port scanning**

Look for a source contacting many destination ports or hosts over a short period. Thresholds should be tuned to the environment rather than treated as universal indicators.

```sql
SELECT
  src_ip,
  COUNT(DISTINCT dst_ip) AS destination_hosts,
  COUNT(DISTINCT dst_port) AS destination_ports,
  COUNT(*) AS flow_records
FROM network_flows
WHERE start_time >= CURRENT_TIMESTAMP - INTERVAL '10' MINUTE
GROUP BY src_ip
HAVING COUNT(DISTINCT dst_port) > 50
    OR COUNT(DISTINCT dst_ip) > 100
ORDER BY flow_records DESC;
```

Authorized vulnerability scanners, inventory tools, and network-management systems can generate similar patterns. Check scan schedules and the source asset’s owner before escalating.

**Unusual outbound volume**

Aggregate outbound bytes by host and time window, then compare the results with a baseline for that host’s role. High volume could reflect a backup, deployment, or cloud synchronization job; investigate destination, timing, and application context before drawing conclusions.

### 6. Pivot from a lead to corroborating evidence

For each promising result, build a timeline and check independent data sources. Useful pivots include:

- **Asset inventory:** Who owns the source host, and what is its normal function?
- **DNS logs:** Did the host resolve a name near the connection time? Was the answer consistent with the observed destination IP?
- **Firewall, proxy, or cloud logs:** Was the connection allowed or denied? Do other records show a hostname, policy, or application?
- **Endpoint telemetry:** Was a process active at the time? Do process, file, or security events provide context?
- **Identity logs:** Was there unusual authentication activity associated with the host or user?
- **Network sensor records:** Do connection states or related protocol metadata add useful context?

Preserve the time range, query, data sources, and relevant record identifiers. Keep any copied evidence within approved storage and access controls.

### 7. Validate before deciding

A useful finding should have a clear chain of reasoning. Record:

1. The original hypothesis and why it was selected.
2. The exact filters, time range, and data sources used.
3. What was observed and what was not available.
4. The asset owner’s explanation and relevant operational context.
5. Corroborating or contradictory evidence.
6. The confidence level and next action.

If evidence is inconclusive, describe the uncertainty. Do not label a host or destination malicious based only on rarity, volume, or a single reputation result.

### 8. Remediate proportionately and verify

If investigation supports a security incident, follow your organization’s incident-response process. Depending on the evidence and operational impact, response steps may include isolating an endpoint, blocking a confirmed malicious destination, disabling a compromised account, or preserving additional logs for investigation. Coordinate changes with the incident lead and system owner, and consider whether a broad network block could disrupt legitimate services.

After remediation, verify the intended result. For example, check whether the suspicious connection stopped, whether related activity moved to another destination, and whether affected systems show continuing indicators. Record who approved the action, when it occurred, and how the result was measured. Address contributing issues, such as exposed services or missing monitoring, through the appropriate change process.

## Example: investigating a rare outbound connection

Suppose a workstation appears in a query for rare external destinations. A practical investigation would be:

1. Confirm the record’s timestamp, sensor, direction, and NAT context.
2. Identify the workstation’s owner and expected role.
3. Review surrounding flows for repeated connections, byte counts, and related destinations.
4. Search DNS and proxy logs around the same time for a hostname or request context.
5. Check endpoint telemetry for the process responsible, if available and authorized.
6. Ask the owner or service team about recent software changes or expected activity.
7. Decide whether the evidence supports benign activity, a monitoring gap, or incident escalation.
8. If action is required, use approved response procedures and verify the outcome.

This process keeps a flow-log alert in context and avoids treating a single unfamiliar IP address as a conclusion.

## Troubleshooting common analysis problems

- **Unexpectedly few records:** Check exporter health, interface coverage, retention, sampling, filters, and ingestion delay.
- **Different tools show different addresses:** Investigate NAT, load balancers, proxies, and the observation point for each source.
- **Timestamps do not line up:** Confirm timezone settings, clock synchronization, ingestion time versus event time, and known processing delays.
- **Byte totals do not match:** Check whether the source reports one direction or both, how retransmissions are counted, and whether records are sampled.
- **Too many benign alerts:** Add asset roles, approved services, scanner schedules, and historical baselines; tune thresholds using observed traffic rather than copying generic values.
- **A query misses IPv6 activity:** Confirm that the data model, IP parsing, filters, and enrichment steps support IPv6.

## Security and privacy considerations

Network flow data can reveal employee, customer, and business activity even when it does not contain payloads. Restrict access to authorized personnel, use approved retention periods, protect exports, and avoid collecting or retaining more data than the investigation requires. Follow applicable policy and legal requirements, especially when linking network records to user identities or endpoint telemetry.

Hunting queries can also create operational load. Use bounded time ranges, appropriate indexes or partitions, and staged aggregation on large datasets. Avoid disruptive testing or active scanning unless it is explicitly authorized and coordinated.

## FAQ

### Do network flow logs show the contents of communications?

Usually not. They typically record connection metadata such as endpoints, ports, timing, and traffic volume. Application content may require a separate, authorized data source, and encrypted traffic limits what can be observed in transit.

### Can flow logs prove that a host is compromised?

No. They can reveal behavior that supports an investigation, but an unusual connection is not proof of compromise. Validate findings with endpoint, DNS, identity, firewall, or other relevant evidence.

### How far back should a threat hunt search?

Choose a window that fits the hypothesis, log retention, and expected behavior. A short window may help identify a scan, while repeated or intermittent activity may require a longer period. Document gaps and compare with an appropriate baseline.

### Which flow-log fields are most useful for hunting?

Start with timestamps, source and destination addresses, ports, protocol, direction, byte or packet counts, action, and sensor identity. Asset context and reliable time normalization are also important for interpretation.

### Are NetFlow, IPFIX, cloud flow logs, and Zeek connection logs equivalent?

No. They can provide overlapping connection metadata, but their schemas, observation points, sampling behavior, and available context differ. Normalize carefully and consult each source’s documentation before comparing fields.

## Conclusion

Network flow logs are a practical source for threat hunting because they help map communication patterns across monitored networks. A reliable hunt starts with a focused question, verifies data coverage, builds an appropriate baseline, and tests behavior with clear queries. The essential next step is validation: correlate flow records with asset, DNS, endpoint, identity, and policy context before deciding whether to remediate. Documenting limitations and verifying response outcomes makes the workflow more repeatable and useful for future investigations.
