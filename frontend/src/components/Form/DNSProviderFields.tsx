import { IconAlertTriangle } from "@tabler/icons-react";
import { Field, useFormikContext } from "formik";
import { useState } from "react";
import Select, { type ActionMeta } from "react-select";
import type { DNSProvider } from "src/api/backend";
import { useDnsCredentials, useDnsProviders, useUser } from "src/hooks";
import { intl, T } from "src/locale";
import styles from "./DNSProviderFields.module.css";

interface DNSProviderOption {
	readonly value: string;
	readonly label: string;
	readonly credentials: string;
}

interface SavedCredentialOption {
	readonly value: number;
	readonly label: string;
	readonly credentials: string;
}

interface Props {
	showBoundaryBox?: boolean;
}
export function DNSProviderFields({ showBoundaryBox = false }: Props) {
	const { values, setFieldValue } = useFormikContext();
	const { data: dnsProviders, isLoading } = useDnsProviders();
	const { data: currentUser } = useUser("me");
	// Saved credentials live behind the admin only settings api, asking for them
	// as a non-admin would answer 403 and log the user straight back out.
	const { data: savedCredentials } = useDnsCredentials({
		enabled: currentUser?.roles?.includes("admin") === true,
	});
	const [dnsProviderId, setDnsProviderId] = useState<string | null>(null);
	const [savedCreds, setSavedCreds] = useState<SavedCredentialOption | null>(null);

	const v: any = values || {};

	const handleChange = (newValue: any, _actionMeta: ActionMeta<DNSProviderOption>) => {
		void setFieldValue("meta.dnsProvider", newValue?.value);
		void setFieldValue("meta.dnsProviderCredentials", newValue?.credentials);
		setSavedCreds(null);
		setDnsProviderId(newValue?.value);
	};

	const handleSavedCredentialChange = (newValue: any, _actionMeta: ActionMeta<SavedCredentialOption>) => {
		setSavedCreds(newValue);
		// Clearing the selection falls back to the providers credentials template
		// rather than leaving the user with an empty box.
		const providerTemplate = dnsProviders?.find((p: DNSProvider) => p.id === dnsProviderId)?.credentials ?? "";
		void setFieldValue("meta.dnsProviderCredentials", newValue?.credentials ?? providerTemplate);
	};

	const options: DNSProviderOption[] =
		dnsProviders?.map((p: DNSProvider) => ({
			value: p.id,
			label: p.name,
			credentials: p.credentials,
		})) || [];

	// Filter saved credentials by the selected DNS provider
	const savedCredentialOptions: SavedCredentialOption[] =
		savedCredentials
			?.filter((cred) => cred.providerId === dnsProviderId)
			.map((cred) => ({
				value: cred.id,
				label: cred.name,
				credentials: cred.credentials,
			})) || [];
	const showSavedCredentialsDropdown = Boolean(dnsProviderId) && savedCredentialOptions.length > 0;

	return (
		<div className={showBoundaryBox ? styles.dnsChallengeWarning : undefined}>
			<p className="text-warning">
				<IconAlertTriangle size={16} className="me-1" />
				<T id="certificates.dns.warning" />
			</p>

			<Field name="meta.dnsProvider">
				{({ field }: any) => (
					<div className="row">
						<label htmlFor="dnsProvider" className="form-label">
							<T id="certificates.dns.provider" />
						</label>
						<Select
							className="react-select-container"
							classNamePrefix="react-select"
							name={field.name}
							inputId="dnsProvider"
							closeMenuOnSelect={true}
							isClearable={false}
							placeholder={intl.formatMessage({ id: "certificates.dns.provider.placeholder" })}
							isLoading={isLoading}
							isSearchable
							onChange={handleChange}
							options={options}
						/>
					</div>
				)}
			</Field>

			{dnsProviderId ? (
				<>
					{showSavedCredentialsDropdown && (
						<div className="mt-3">
							<label htmlFor="savedCredential" className="form-label">
								<T id="certificates.dns.saved-credentials" />
							</label>
							<Select
								className="react-select-container"
								classNamePrefix="react-select"
								inputId="savedCredential"
								closeMenuOnSelect={true}
								isClearable={true}
								placeholder={intl.formatMessage({
									id: "certificates.dns.saved-credentials.placeholder",
								})}
								value={savedCreds}
								isSearchable={false}
								onChange={handleSavedCredentialChange}
								options={savedCredentialOptions}
							/>
							<small className="text-muted">
								<T id="certificates.dns.saved-credentials-note" />
							</small>
						</div>
					)}
					<Field name="meta.dnsProviderCredentials">
						{({ field }: any) => (
							<div className="mt-3">
								<label htmlFor="dnsProviderCredentials" className="form-label">
									<T id="certificates.dns.credentials" />
								</label>
								<textarea
									className="form-control"
									spellCheck={false}
									id="dnsProviderCredentials"
									style={{
										fontFamily:
											"ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
										borderRadius: "0.3rem",
										minHeight: "130px",
										backgroundColor: "var(--tblr-bg-surface-dark)",
									}}
									value={v.meta.dnsProviderCredentials || ""}
									{...field}
								/>
								<div>
									<small className="text-muted">
										<T id="certificates.dns.credentials-note" />
									</small>
								</div>
								<div>
									<small className="text-danger">
										<T id="certificates.dns.credentials-warning" />
									</small>
								</div>
							</div>
						)}
					</Field>
					<Field name="meta.propagationSeconds">
						{({ field }: any) => (
							<div className="mt-3">
								<label htmlFor="propagationSeconds" className="form-label">
									<T id="certificates.dns.propagation-seconds" />
								</label>
								<input
									id="propagationSeconds"
									type="number"
									className="form-control"
									min={0}
									max={7200}
									{...field}
								/>
								<small className="text-muted">
									<T id="certificates.dns.propagation-seconds-note" />
								</small>
							</div>
						)}
					</Field>
				</>
			) : null}
		</div>
	);
}
