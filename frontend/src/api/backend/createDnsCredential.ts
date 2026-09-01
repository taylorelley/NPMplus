import * as api from "./base";
import type { DnsCredential } from "./models";

export async function createDnsCredential(item: DnsCredential): Promise<DnsCredential> {
	// Remove readonly fields
	const { id: _, createdOn: __, modifiedOn: ___, ...data } = item;

	return await api.post({
		url: "/nginx/dns-credentials",
		data,
	});
}
