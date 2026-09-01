import { useQuery } from "@tanstack/react-query";
import { type DnsCredential, getDnsCredentials } from "src/api/backend";

const fetchDnsCredentials = () => getDnsCredentials();

const useDnsCredentials = (options = {}) =>
	useQuery<DnsCredential[], Error>({
		queryKey: ["dns-credentials"],
		queryFn: () => fetchDnsCredentials(),
		staleTime: 60 * 1000,
		...options,
	});

export { useDnsCredentials };
