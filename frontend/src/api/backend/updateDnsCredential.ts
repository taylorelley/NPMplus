import * as api from "./base";
import type { DnsCredential } from "./models";

export async function updateDnsCredential(item: DnsCredential): Promise<DnsCredential> {
	// Remove readonly fields
	const { id, createdOn: _, modifiedOn: __, ...data } = item;

	return await api.put({
		url: `/nginx/dns-credentials/${id}`,
		data,
	});
}
