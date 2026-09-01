import { Field, Form, Formik } from "formik";
import { type ReactNode, useState } from "react";
import { Alert } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import Select from "react-select";
import type { DNSProvider } from "src/api/backend";
import { Button, Loading } from "src/components";
import { useDnsCredential, useDnsProviders, useSetDnsCredential } from "src/hooks";
import { intl, T } from "src/locale";
import EasyModal, { type InnerModalProps } from "src/modules/easyModal";
import { validateString } from "src/modules/Validations";
import { showObjectSuccess } from "src/notifications";

interface ProviderOption {
	readonly value: string;
	readonly label: string;
	readonly credentials: string;
}

const showDnsCredentialModal = (id: number | "new") => {
	EasyModal.show(DnsCredentialModal, { id });
};

interface Props extends InnerModalProps {
	id: number | "new";
}

const DnsCredentialModal = EasyModal.create(({ id, visible, remove }: Props) => {
	const isNew = id === "new";
	const { data, isLoading, error } = useDnsCredential(id);
	const { data: dnsProviders, isLoading: providersLoading } = useDnsProviders();
	const { mutate: setDnsCredential } = useSetDnsCredential();
	const [errorMsg, setErrorMsg] = useState<ReactNode | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = (values: any, { setSubmitting }: any) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		setErrorMsg(null);

		setDnsCredential(
			{
				id: isNew ? 0 : id,
				name: values.name,
				providerId: values.providerId,
				credentials: values.credentials,
			},
			{
				onError: (err: any) => {
					setErrorMsg(<T id={err.message} />);
				},
				onSuccess: () => {
					showObjectSuccess("dns-credentials", "saved");
					remove();
				},
				onSettled: () => {
					setIsSubmitting(false);
					setSubmitting(false);
				},
			},
		);
	};

	const providerOptions: ProviderOption[] =
		dnsProviders?.map((p: DNSProvider) => ({
			value: p.id,
			label: p.name,
			credentials: p.credentials,
		})) || [];

	return (
		<Modal show={visible} onHide={remove}>
			{!isLoading && error && (
				<Alert variant="danger" className="m-3">
					{error.message}
				</Alert>
			)}
			{isLoading && <Loading noLogo />}
			{!isLoading && !error && data && (
				<Formik
					initialValues={
						{
							name: data.name || "",
							providerId: data.providerId || "",
							credentials: data.credentials || "",
						} as any
					}
					onSubmit={onSubmit}
				>
					{({ values, setFieldValue }) => (
						<Form>
							<Modal.Header closeButton>
								<Modal.Title>
									<T
										id={isNew ? "object.add" : "object.edit"}
										tData={{ object: "dns-credentials" }}
									/>
								</Modal.Title>
							</Modal.Header>
							<Modal.Body className="p-0">
								<Alert
									variant="danger"
									show={Boolean(errorMsg)}
									onClose={() => setErrorMsg(null)}
									dismissible
								>
									{errorMsg}
								</Alert>
								<div className="card m-0 border-0">
									<div className="card-body">
										<Field name="name" validate={validateString(1, 100)}>
											{({ field, form }: any) => (
												<div className="mb-3">
													<label className="form-label" htmlFor="dnsCredentialName">
														<T id="settings.dns-credentials.name" />
													</label>
													<input
														id="dnsCredentialName"
														className="form-control"
														type="text"
														{...field}
													/>
													{form.errors.name && form.touched.name ? (
														<div className="invalid-feedback d-block">
															{form.errors.name}
														</div>
													) : null}
												</div>
											)}
										</Field>

										<Field name="providerId" validate={validateString(1, 100)}>
											{({ form }: any) => (
												<div className="mb-3">
													<label className="form-label" htmlFor="dnsCredentialProvider">
														<T id="settings.dns-credentials.provider" />
													</label>
													<Select
														className="react-select-container"
														classNamePrefix="react-select"
														inputId="dnsCredentialProvider"
														closeMenuOnSelect={true}
														isClearable={false}
														isLoading={providersLoading}
														isSearchable
														placeholder={intl.formatMessage({
															id: "settings.dns-credentials.select-provider",
														})}
														value={
															providerOptions.find(
																(o) => o.value === values.providerId,
															) ?? null
														}
														options={providerOptions}
														onChange={(newValue) => {
															void setFieldValue("providerId", newValue?.value ?? "");
															// Prefill the credentials with the providers template,
															// but never wipe out what was already entered.
															if (newValue && !values.credentials) {
																void setFieldValue("credentials", newValue.credentials);
															}
														}}
													/>
													{form.errors.providerId && form.touched.providerId ? (
														<div className="invalid-feedback d-block">
															{form.errors.providerId}
														</div>
													) : null}
												</div>
											)}
										</Field>

										<Field name="credentials" validate={validateString(1, 20000)}>
											{({ field, form }: any) => (
												<div className="mb-3">
													<label className="form-label" htmlFor="dnsCredentialCredentials">
														<T id="settings.dns-credentials.credentials" />
													</label>
													<textarea
														id="dnsCredentialCredentials"
														className="form-control"
														spellCheck={false}
														style={{
															fontFamily:
																"ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
															borderRadius: "0.3rem",
															minHeight: "130px",
															backgroundColor: "var(--tblr-bg-surface-dark)",
														}}
														{...field}
													/>
													{form.errors.credentials && form.touched.credentials ? (
														<div className="invalid-feedback d-block">
															{form.errors.credentials}
														</div>
													) : null}
													<small className="text-muted">
														<T id="settings.dns-credentials.credentials-note" />
													</small>
												</div>
											)}
										</Field>
									</div>
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button data-bs-dismiss="modal" onClick={remove} disabled={isSubmitting}>
									<T id="cancel" />
								</Button>
								<Button
									type="submit"
									actionType="primary"
									className="ms-auto"
									data-bs-dismiss="modal"
									isLoading={isSubmitting}
									disabled={isSubmitting}
								>
									<T id="save" />
								</Button>
							</Modal.Footer>
						</Form>
					)}
				</Formik>
			)}
		</Modal>
	);
});

export { showDnsCredentialModal };
