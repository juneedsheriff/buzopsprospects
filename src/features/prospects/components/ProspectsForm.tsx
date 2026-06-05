'use client';

import type { ProspectsFormProps, UserMemberResponse } from '@/types/prospects';
import type { GoogleUserProfile } from '@/types/google';
import { Button } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { cn } from '@/lib/utils';
import { Form, Formik, useFormikContext } from 'formik';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CameraUploadModal from '../../CameraUploadModal';
import { useSelectedMemberStore } from '@/stores/selectedMember.store';
import { PurchaseStep, usePurchaseStore } from '@/stores/purchase.store';
import { BookAppointmentStep, useBookAppointmentStore } from '@/stores/bookAppointment.store';
import { useManageProspects } from '../hooks/useManageProspects';
import EmailExistsModal from './EmailExistsModal';
import { ProspectFormAutoSave } from './ProspectFormAutoSave';
import { ProspectsFormFields } from './ProspectsFormFields';
import { useUserAuthStore } from '@/stores/userAuth.store';
import { checkStateLabel } from '@/utils/addressUtils';
import GoogleProspectLogin from '@/components/GoogleProspectLogin';
import { fetchGoogleProfileImageAsFile } from '@/lib/googleAuth';
import {
  APPT_ACCENT_OUTLINE_BUTTON_CLASS,
  APPT_MOBILE_ACTION_BAR_CLASS,
  APPT_PAGE_BG,
  APPT_PRIMARY_BUTTON_CLASS,
  APPT_SECONDARY_BUTTON_CLASS,
} from '@/components/appointment-types/components/appointmentFormStyles';
import {
  calculateFormCompletion,
  clearProspectDraft,
  loadProspectDraft,
  ProfileUploadCard,
  ProspectFormPageHeader,
  saveProspectDraft,
} from './form-ui';

const FIELD_ORDER = [
  'firstName',
  'lastName',
  'phoneNumber',
  'email',
  'address',
  'city',
  'state',
  'zipcode',
  'referredFrom',
  'specifyOthers',
];

const ScrollToFirstError: React.FC = () => {
  const { errors, submitCount } = useFormikContext<Record<string, unknown>>();
  const scrolledForSubmitRef = useRef(0);

  useEffect(() => {
    if (submitCount > 0 && submitCount !== scrolledForSubmitRef.current && Object.keys(errors).length > 0) {
      scrolledForSubmitRef.current = submitCount;
      const firstErrorField = FIELD_ORDER.find(field => errors[field]);
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField)
          ?? document.querySelector<HTMLElement>(`[name="${firstErrorField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus({ preventScroll: true });
        }
      }
    }
  }, [submitCount, errors]);

  return null;
};

const ProspectsForm: React.FC<ProspectsFormProps> = ({
  initialValues,
  isEditing = false,
}) => {
  const user = useUserAuthStore(s => s.user);
  const usersession = user?.UserSession;

  const t = useTranslations('Prospects');
  const tPersonal = useTranslations('PersonalInfo');
  const countryCode = usersession?.ClubPreferences?.CountryCode ?? 0;
  const stateLabel = checkStateLabel(countryCode) ? t('labels.Province') : t('labels.State');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelectedClient, setPreviousAdminRoute } = useSelectedMemberStore();

  const {
    defaultFormValues,
    isSubmitting,
    previewUrl,
    cameraModalOpened,
    statesOptions,
    showAdditional,
    newMemberId,
    newMemberName,
    isAddressMandatory,
    handleSubmit,
    handleImageUpload,
    handleRemoveImage,
    handleOpenCameraModal,
    handleCloseCameraModal,
    validateFormData,
    handleVerifyEmail,
    handleActivateProspects,
  } = useManageProspects(initialValues, isEditing);

  const { setPurchaseType, setPurchaseDrawerOpened, setStep: setPurchaseStep } = usePurchaseStore();
  const { setBookApptType, setBookApptDrawerOpened, setStep: setBookApptStep } = useBookAppointmentStore();

  const mergedInitialValues = useMemo(() => {
    const draft = loadProspectDraft();
    if (draft && !isEditing) {
      return { ...defaultFormValues, ...draft };
    }
    return defaultFormValues;
  }, [defaultFormValues, isEditing]);

  const navigateToClientAction = useCallback((action: 'membership' | 'package' | 'group' | 'appointments' | 'waiver') => {
    setSelectedClient({
      UserMemberId: newMemberId,
      UserId: 0,
      FirstName: newMemberName.split(' ')[0] || '',
      LastName: newMemberName.split(' ').slice(1).join(' ') || '',
      FullName: newMemberName,
      Email: '',
      Phone: '',
      MemberNumber: '',
      MainMemberId: newMemberId,
      MemberType: 0,
      Photo: null,
      Status: 1,
    });
    setPreviousAdminRoute('/prospects/add');

    if (action === 'membership') {
      setPurchaseType('membership');
      setPurchaseDrawerOpened(true);
      setPurchaseStep(PurchaseStep.SelectPackage);
    }
    else if (action === 'package') {
      setPurchaseType('package');
      setPurchaseDrawerOpened(true);
      setPurchaseStep(PurchaseStep.SelectPackage);
    }
    else if (action === 'group') {
      setBookApptType('group');
      setBookApptDrawerOpened(true);
      setBookApptStep(BookAppointmentStep.SelectAppointmentItem);
    }
    else if (action === 'appointments') {
      setBookApptDrawerOpened(true);
      setBookApptStep(BookAppointmentStep.SelectType);
    }
    router.push('/ClientDashboard/overview');
  }, [newMemberId, newMemberName, setSelectedClient, setPreviousAdminRoute, setPurchaseType, setPurchaseDrawerOpened, setPurchaseStep, setBookApptType, setBookApptDrawerOpened, setBookApptStep, router]);

  const handleCancel = () => {
    const from = searchParams.get('from');
    if (from === 'membership-subscribers') {
      router.push('/subscription?type=1');
    }
    else {
      router.push('/prospects');
    }
  };

  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [emailExistsModalOpened, setEmailExistsModalOpened] = useState(false);
  const [existingClient, setExistingClient] = useState<UserMemberResponse | null>(null);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);

  const handleEmailChange = useCallback(async (value: string, setFieldValue: (field: string, value: unknown) => void) => {
    setFieldValue('email', value || '');
    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current);
    }

    if (value && value.length >= 3) {
      emailTimeoutRef.current = setTimeout(async () => {
        if (value && value.includes('@')) {
          const data = await handleVerifyEmail(value);
          if (data && data.UserId > 0) {
            setExistingClient(data);
            setEmailExistsModalOpened(true);
          }
        }
      }, 300);
    }
  }, [handleVerifyEmail]);

  const handleGoogleAuthSuccess = useCallback(async (
    googleUser: GoogleUserProfile,
    setFieldValue: (field: string, value: unknown) => void,
  ) => {
    setFieldValue('email', googleUser.email);
    setFieldValue('firstName', googleUser.givenName);
    setFieldValue('lastName', googleUser.familyName);

    if (googleUser.picture) {
      const profileFile = await fetchGoogleProfileImageAsFile(googleUser.picture);
      if (profileFile) {
        await handleImageUpload(profileFile);
      }
      else {
        notifications.show({
          title: 'Profile photo unavailable',
          message: 'Google sign-in succeeded, but the profile photo could not be loaded. You can upload one manually.',
          color: 'yellow',
        });
      }
    }

    if (googleUser.email.includes('@')) {
      const data = await handleVerifyEmail(googleUser.email);
      if (data && data.UserId > 0) {
        setExistingClient(data);
        setEmailExistsModalOpened(true);
      }
    }
  }, [handleImageUpload, handleVerifyEmail]);

  const handleEmailExistsModalClose = () => {
    setEmailExistsModalOpened(false);
    setExistingClient(null);
  };

  const handleEmailExistsContinue = async () => {
    if (existingClient && existingClient.UserId > 0) {
      if (existingClient.UserMemberId > 0) {
        if (!existingClient.UserMemberIsActive) {
          await handleActivateProspects(existingClient.UserMemberId);
        }
        setSelectedClient({
          UserMemberId: existingClient.UserMemberId,
          UserId: existingClient.UserId,
          FirstName: existingClient.FirstName,
          LastName: existingClient.LastName,
          FullName: `${existingClient.FirstName} ${existingClient.LastName}`,
          Email: existingClient.Email,
          Phone: existingClient.Phone ?? '',
          MemberNumber: '',
          MainMemberId: existingClient.UserMemberId,
          MemberType: 0,
          Photo: null,
          Status: 1,
        });
        setPreviousAdminRoute('/prospects');
        router.push('/ClientDashboard/overview');
      }
      else {
        router.push('/prospects');
      }
    }
    setEmailExistsModalOpened(false);
    setExistingClient(null);
  };

  return (
    <>
      <Formik
        initialValues={mergedInitialValues}
        validate={validateFormData}
        onSubmit={async (values) => {
          const ok = await handleSubmit(values);
          if (ok) clearProspectDraft();
        }}
        enableReinitialize
      >
        {({ errors, values, touched, setFieldValue, isSubmitting: formikSubmitting }) => {
          const completionPercent = calculateFormCompletion(values, isAddressMandatory, Boolean(previewUrl));

          const handleSaveDraft = () => {
            saveProspectDraft(values);
            notifications.show({
              title: 'Draft saved',
              message: 'Your progress has been saved locally.',
              color: 'blue',
            });
          };

          const pageTitle = isEditing ? t('common.edit') : t('header');

          const formActions = (
            <>
              {!showAdditional && !isEditing && (
                <Button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || formikSubmitting}
                  className={APPT_ACCENT_OUTLINE_BUTTON_CLASS}
                >
                  Save Draft
                </Button>
              )}

              {showAdditional && (
                <>
                  <Button
                    id="Sign-Waiver"
                    type="button"
                    onClick={() => navigateToClientAction('waiver')}
                    className={APPT_ACCENT_OUTLINE_BUTTON_CLASS}
                  >
                    {t('form.signWaiver')}
                  </Button>
                  <Button
                    id="membership"
                    type="button"
                    onClick={() => navigateToClientAction('membership')}
                    className={APPT_ACCENT_OUTLINE_BUTTON_CLASS}
                  >
                    {t('form.purchaseMembership')}
                  </Button>
                  <Button
                    id="appoinments"
                    type="button"
                    onClick={() => navigateToClientAction('appointments')}
                    className={APPT_ACCENT_OUTLINE_BUTTON_CLASS}
                  >
                    {t('form.purchaseAppointments')}
                  </Button>
                  <Button
                    id="group"
                    type="button"
                    onClick={() => navigateToClientAction('group')}
                    className={APPT_ACCENT_OUTLINE_BUTTON_CLASS}
                  >
                    {t('form.purchaseGroup')}
                  </Button>
                  <Button
                    id="package"
                    type="button"
                    onClick={() => navigateToClientAction('package')}
                    className={APPT_ACCENT_OUTLINE_BUTTON_CLASS}
                  >
                    {t('form.purchasePackage')}
                  </Button>
                </>
              )}

              <Button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting || formikSubmitting}
                className={APPT_SECONDARY_BUTTON_CLASS}
              >
                {t('form.cancel')}
              </Button>

              {!showAdditional && (
                <Button
                  id="createProspect-submit"
                  disabled={isSubmitting || formikSubmitting}
                  type="submit"
                  loading={isSubmitting || formikSubmitting}
                  leftSection={<IconCheck size={16} />}
                  className={APPT_PRIMARY_BUTTON_CLASS}
                >
                  {isEditing ? t('form.updateProspect') : t('form.saveButton')}
                </Button>
              )}
            </>
          );

          const headerActions = (
            <div className="hidden flex-wrap items-center gap-2 xl:flex">
              {formActions}
            </div>
          );

          return (
            <Form className="prospect-form flex min-h-0 flex-1 flex-col pb-24 xl:pb-0">
              <ScrollToFirstError />
              <ProspectFormAutoSave
                disabled={showAdditional || isEditing}
                onSaved={setAutoSavedAt}
              />

              <header className="shrink-0 border-b border-[#E2E8F0]/80 bg-[#F5F7FB]/90 backdrop-blur-md px-4 py-3 dark:border-slate-700/60 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-[1600px]">
                  <ProspectFormPageHeader
                    breadcrumbDashboard="Dashboard"
                    breadcrumbClients={t('title')}
                    breadcrumbCurrent={pageTitle}
                    title={pageTitle}
                    clientsHref="/prospects"
                    actions={headerActions}
                  />
                </div>
              </header>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto">
              <main className={cn(APPT_PAGE_BG, 'min-h-full pb-24 xl:pb-8')}>
                <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                  {autoSavedAt && !showAdditional && (
                    <p className="mb-4 text-xs font-medium text-[#10B981] dark:text-emerald-400" role="status">
                      Auto-saved at {autoSavedAt}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
                    <div className="xl:col-span-8 space-y-6 sm:space-y-8">
                      <ProspectsFormFields
                        t={t}
                        tPersonal={tPersonal}
                        stateLabel={stateLabel}
                        statesOptions={statesOptions}
                        isAddressMandatory={isAddressMandatory}
                        showAdditional={showAdditional}
                        values={values}
                        errors={errors}
                        touched={touched}
                        setFieldValue={setFieldValue}
                        handleEmailChange={handleEmailChange}
                        googleLoginSlot={
                          !showAdditional && !isEditing
                            ? (
                                <GoogleProspectLogin
                                  disabled={isSubmitting || formikSubmitting}
                                  onSuccess={user => handleGoogleAuthSuccess(user, setFieldValue)}
                                />
                              )
                            : undefined
                        }
                      />
                    </div>

                    <div className="xl:col-span-4">
                      <ProfileUploadCard
                        previewUrl={previewUrl}
                        disabled={showAdditional}
                        completionPercent={completionPercent}
                        title={t('form.profilePicture')}
                        supportedFormatsLabel={`${t('form.supportedFormats')} · up to 5MB`}
                        uploadLabel={t('form.uploadPhoto')}
                        cameraLabel="Open Camera"
                        removeLabel="Remove"
                        onUpload={handleImageUpload}
                        onRemove={handleRemoveImage}
                        onOpenCamera={handleOpenCameraModal}
                      />
                    </div>
                  </div>
                </div>
              </main>
                </div>
              </div>

              <div className={cn(APPT_MOBILE_ACTION_BAR_CLASS, 'lg:left-[var(--sidebar-width,240px)]')}>
                {showAdditional
                  ? (
                      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-end gap-2">
                        {formActions}
                      </div>
                    )
                  : (
                      <div className="mx-auto flex max-w-lg gap-2">
                        <Button
                          type="button"
                          className={cn(APPT_SECONDARY_BUTTON_CLASS, 'flex-1')}
                          onClick={handleCancel}
                          disabled={isSubmitting || formikSubmitting}
                        >
                          {t('form.cancel')}
                        </Button>
                        <Button
                          id="createProspect-submit-mobile"
                          type="submit"
                          disabled={isSubmitting || formikSubmitting}
                          loading={isSubmitting || formikSubmitting}
                          leftSection={<IconCheck size={16} />}
                          className={cn(APPT_PRIMARY_BUTTON_CLASS, 'flex-[2]')}
                        >
                          {isEditing ? t('form.updateProspect') : t('form.saveButton')}
                        </Button>
                      </div>
                    )}
              </div>
            </Form>
          );
        }}
      </Formik>

      <CameraUploadModal
        opened={cameraModalOpened}
        onClose={handleCloseCameraModal}
        onImageCapture={handleImageUpload}
        title={t('form.uploadPhoto')}
      />

      <EmailExistsModal
        opened={emailExistsModalOpened}
        onClose={handleEmailExistsModalClose}
        onContinue={handleEmailExistsContinue}
        existingClient={existingClient}
      />
    </>
  );
};

export default ProspectsForm;
