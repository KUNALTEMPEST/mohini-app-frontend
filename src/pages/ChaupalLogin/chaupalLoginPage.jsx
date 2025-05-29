/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios";
import { useUserDispatcher } from "../../context/user";
import { useLocalStorage } from "react-use";
import USER_ACTIONS from "../../context/user/user-actions";
import ROUTES from "../../url";
import { BiLoader } from "react-icons/bi";
import "../../components/custom-style.css";
import "../../index.css";
import "./chaupalLoginStyle.css";
import i18n, { setLanguage } from '../../i18n';
import { useTranslation } from "react-i18next";
import { getProfileDetails, getSessionDetails, getUserProfile, transliterateApi } from "../../services/api.service";
import { languageList, sessionFlowName } from "../ShikshalokamVoiceChat/enum";
import FormData from "../../components/Form/FormData";
import { clearFromStorage, getFromStorage, setInStorage } from "../../services/storage_service";
import { bot_routes } from "../../configure";

const login_api_url = `/api/login/`;

function ChaupalLogin({ type, variant }) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("");
  const [dateOfDiscussion, setDateOfDiscussion] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  const [pageLanguage, setPageLanguage] = useState(
    getFromStorage("local_route", true) || languageList[0].value
  );
  const [userState, setUserState] = useState({
    key: "",
    value: ""
  });
  const [userDistrict, setUserDistrict] = useState({
    key: "",
    value: ""
  });
  const [userBlock, setUserBlock] = useState({
    key: "",
    value: ""
  });
  const [phoneNumberField, setPhoneNumberField] = useState(getFromStorage('phoneNumber') || "");
  const [fieldError, setFieldError] = useState("");
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const userDispatcher = useUserDispatcher();
  const [, setLocalUserData] = useLocalStorage("grit", {});
  const [, , removeLocalChatHistory] =
  useLocalStorage("chat-history", []);

  const idData = {
    phone: "phnNumID",
    state: "stateNameID",
    district: "districtNameID",
    userName: "nameID",
    organization: "organizationID",
    numberOfPeople: "numberOfPeopleID",
    dateOfDiscussion: "dateQuestionID",
    tnc: "tncID"
  }

  const [stateLabelArray, setStateLabelArray] = useState([]);
  const [districtLabelArray, setDistrictLabelArray] = useState([]);
  const [blockLabelArray, setBlockLabelArray] = useState([]);
  const [errorFieldName, setErrorFieldName] = useState({
    phone: false,
    state: false,
    district: false,
    userName: false,
    organization: false,
    numberOfPeople: false,
    dateOfDiscussion: false,
    tnc: false
  });

  const { t } = useTranslation();

  useEffect(()=>{
    getStateLabelValue()
  }, [])

  useEffect(()=>{
    const userCompany= getFromStorage('company', true);
    if(userCompany && userCompany!=='') {
      clearFromStorage();
    }
  }, [])

  const handleScrollToView = (idName) => {
    try {
      document?.querySelector(`#${idName}`)?.scrollIntoView({
        behavior: "smooth",
      });
    } catch (error) {
      console.error({ error });
    }
  };

  function resetFieldError() {
    setFieldError("");
    setErrorFieldName({
      phone: false,
      state: false,
      district: false,
      userName: false,
      organization: false,
      numberOfPeople: false,
      dateOfDiscussion: false,
      tnc: false
    });
  }

  const handlePageLanguageChange = (e) => {
    setPageLanguage(e?.target?.value);
    setLanguage(e?.target?.value);
    setInStorage("local_route", JSON.stringify(e?.target?.value), sessionFlowName.GuestDiscussion);
    
  };

  const handlePhoneChange = (e) => {
    if (e?.target?.value?.length <= 10) {
      const numericInput = e?.target?.value?.replace(/[^0-9]/g, "");
      setPhoneNumberField(numericInput);
      setInStorage('phoneNumber', numericInput, sessionFlowName.GuestDiscussion);
    }
    resetFieldError();
  };

  const handleStateChange = (e) => {
    resetFieldError();
    setUserState({
      key: e?.target?.selectedOptions[0]?.text,
      value: e?.target?.value
    });
    setDistrictLabelArray([])
    setBlockLabelArray([])
    const tempDistArray = getDistrictLabelValue(e?.target?.value)
    setUserDistrict({
      key: "",
      value: ""
    })
    setUserBlock({
      key: "",
      value: ""
    });
  };

  const handleDistrictChange = (e) => {
    resetFieldError();
    setUserDistrict({
      key: e?.target?.selectedOptions[0]?.text,
      value: e?.target?.value
    });
    setBlockLabelArray([])
    getBlockLabelValue(e?.target?.value)
    setUserBlock({
      key: "",
      value: ""
    });
  };

  const handleNameChange = (e) => {
    resetFieldError();
    setFirstName(e.target.value);
  };

  const handleOrganizationChange = (e) => {
    resetFieldError();
    setOrganizationName(e.target.value);
  };

  const handleNumberOfPeopleChange = (e) => {
    const cleanedValue = e.target.value.replace(/\D/g, '');
    resetFieldError();
    setNumberOfPeople(cleanedValue);
  };

  const handleDateChange = (e) => {
    resetFieldError();
    setDateOfDiscussion(e.target.value);
  };

  const isValidIndianMobileNumber = (number) => {
    const regex = /^(?!.*(\d)(\1{9}))[6-9]\d{9}$/;
    return regex.test(number);
  };

  const getStateLabelValue = async () => {
    try {
      const response = await axiosInstance({
        url: 'api/get-location/',
        method: "GET",
      });
  
      const list = response?.data?.list;
  
      if (Array.isArray(list) && list.length > 0) {
        setStateLabelArray(
          list.map(item => ({
            label: item?.name || "",
            value: item?.id || ""
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    }
  };

  const getDistrictLabelValue = async (id) => {
    let tempDistArray = []
    try {

      if(!id) {
        setDistrictLabelArray([])
        return;
      }
      const response = await axiosInstance({
        url: `api/get-location/?parentId=${id}`,
        method: "GET",
      });
  
      const list = response?.data?.list;
  
      if (Array.isArray(list) && list.length > 0) {
        const mappedList = Array.isArray(list)
        ? list.map(item => ({
            label: item?.name || "",
            value: item?.id || ""
          }))
        : [];
        setDistrictLabelArray(mappedList);
        tempDistArray=mappedList
      } else{
        setDistrictLabelArray([])
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    }

    return tempDistArray;
  };

  const getBlockLabelValue = async (id) => {
    try {

      if(!id) {
        setBlockLabelArray([])
        return;
      }
      const response = await axiosInstance({
        url: `api/get-location/?parentId=${id}`,
        method: "GET",
      });
  
      const list = response?.data?.list;
  
      if (Array.isArray(list) && list.length > 0) {
        setBlockLabelArray(
          list.map(item => ({
            label: item?.name || "",
            value: item?.id || ""
          }))
        );
      } else{
        setBlockLabelArray([])
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    }
  };

  const fieldValidationCheck = () => {
    
    let hasFailedValidation = false;
    let idToScroll = '';
    const profileId = getFromStorage('profileid', true)

    if(!profileId){
      if (phoneNumberField && !isValidIndianMobileNumber(phoneNumberField)) {
        setFieldError(t('invalidPhoneNumberMessage'));
        hasFailedValidation=true;
      }
      if (!phoneNumberField || phoneNumberField === '') {
        setFieldError(t('mandatoryFieldMessage'));
        hasFailedValidation=true;
      }
      if(hasFailedValidation){
        idToScroll = idData?.phone;
        setErrorFieldName({
          phone: true,
          state: false,
          district: false,
          userName: false,
          organization: false,
          numberOfPeople: false,
          dateOfDiscussion: false,
          tnc: false
        });
      } else if(!isChecked){
        idToScroll = idData?.tnc;
        setFieldError(t('mandatoryCheckBoxMessage'));
        hasFailedValidation=true;
        setErrorFieldName({
          phone: false,
          state: false,
          district: false,
          userName: false,
          organization: false,
          numberOfPeople: false,
          dateOfDiscussion: false,
          tnc: true
        });
      }
    } else {
      if(!firstName || firstName === ''){
        idToScroll = idData?.userName;
        setFieldError(t('mandatoryFieldMessage'));
        hasFailedValidation=true;
        setErrorFieldName({
          phone: false,
          state: false,
          district: false,
          userName: true,
          organization: false,
          numberOfPeople: false,
          dateOfDiscussion: false,
          tnc: false
        });
      } else if(stateLabelArray?.length > 0 && (!userState?.value || userState?.value === '')){
        idToScroll = idData?.state;
        setFieldError(t('mandatoryFieldMessage'));
        hasFailedValidation=true;
        setErrorFieldName({
          phone: false,
          state: true,
          district: false,
          userName: false,
          organization: false,
          numberOfPeople: false,
          dateOfDiscussion: false,
          tnc: false
        });
      } else if(districtLabelArray?.length > 0 && (!userDistrict?.value || userDistrict?.value === '')){
        idToScroll = idData?.district;
        setFieldError(t('mandatoryFieldMessage'));
        hasFailedValidation=true;
        setErrorFieldName({
          phone: false,
          state: false,
          district: true,
          userName: false,
          organization: false,
          numberOfPeople: false,
          dateOfDiscussion: false,
          tnc: false
        });
      } else if(!organizationName || organizationName === ''){
        idToScroll = idData?.organization;
        setFieldError(t('mandatoryFieldMessage'));
        hasFailedValidation=true;
        setErrorFieldName({
          phone: false,
          state: false,
          district: false,
          userName: false,
          organization: true,
          numberOfPeople: false,
          dateOfDiscussion: false,
          tnc: false
        });
      } else if(!numberOfPeople || numberOfPeople === ''){
        idToScroll = idData?.numberOfPeople;
        setFieldError(t('mandatoryFieldMessage'));
        hasFailedValidation=true;
        setErrorFieldName({
          phone: false,
          state: false,
          district: false,
          userName: false,
          organization: false,
          numberOfPeople: true,
          dateOfDiscussion: false,
          tnc: false
        });
      } else if(!dateOfDiscussion || dateOfDiscussion === ''){
        idToScroll = idData?.dateOfDiscussion;
        setFieldError(t('mandatoryFieldMessage'));
        hasFailedValidation=true;
        setErrorFieldName({
          phone: false,
          state: false,
          district: false,
          userName: false,
          organization: false,
          numberOfPeople: false,
          dateOfDiscussion: true,
          tnc: false
        });
      }
    }
    if(hasFailedValidation){
      handleScrollToView(idToScroll);
      return false;
    }

    return true;
  }
  

  const submitForm = async (event) => {
    try{
      if (!event.target.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    
      event.preventDefault();
      setFieldError("");
      
      const isValidationCorrect = fieldValidationCheck();
      if(!isValidationCorrect) return;

      const customEmail = phoneNumberField + "@shikshalokam.org"
  
      const body = {
        email: customEmail,
        phone: phoneNumberField,
        company: "shikshalokamstaging",
        password: "grit@123",
        latest_flow_used: sessionFlowName.GuestDiscussion,
      };

      if (firstName) body.first_name = firstName;
      if (organizationName) body.org_associated = organizationName;
      const otherParams = {};
      if (numberOfPeople) otherParams.participants_count = numberOfPeople;
      if (dateOfDiscussion) otherParams.discussion_date = dateOfDiscussion;
      if (Object.keys(otherParams).length > 0) body.other_params = otherParams;
      
      const profileAddr = {};
      if (userState?.key) profileAddr.state = userState.key;
      if (userBlock?.key) profileAddr.block = userBlock.key;
      if (userDistrict?.key) profileAddr.district = userDistrict.key;
      if (Object.keys(profileAddr).length > 0) body.profile_address = [profileAddr];
      
  
      setIsLoading(true);
      const res = await getProfileDetails(body);
  
      if (res?.status === "error") {
        setLoginErrorMessage(res?.message.slice(2, -2));
        setIsLoading(false);
        return;
      }
      let session = await getSessionDetails();
      
      setInStorage('profileid', JSON.stringify(res.id), sessionFlowName.GuestDiscussion);
		  setInStorage('sessionid', JSON.stringify(session.sessionid), sessionFlowName.GuestDiscussion);
		  setInStorage('isNewChatOpen', JSON.stringify(true), sessionFlowName.GuestDiscussion);
  
      if(firstName && firstName !== '') {
        const response = await axiosInstance({
          url: login_api_url,
          method: "POST",
          data: {
            email: customEmail,
            password: "grit@123",
          },
        });
    
        if (!!response?.data?.access_token) {
          userDispatcher({
            type: USER_ACTIONS.LOGIN,
            payload: response?.data,
          });
          setInStorage('first_name', JSON.stringify(response?.data?.first_name), sessionFlowName.GuestDiscussion);
          setInStorage('company', JSON.stringify(response?.data?.company), sessionFlowName.GuestDiscussion);
          setInStorage('state', JSON.stringify(response?.data?.state));
          setInStorage('flow', sessionFlowName.GuestDiscussion, sessionFlowName.GuestDiscussion);
          setInStorage('has_accepted_tnc', true, sessionFlowName.GuestDiscussion);
          
          const transliteratedFirstName = await transliterateApi(
            response?.data?.first_name, pageLanguage, 'en', bot_routes.shikshalokam_chaupal, false
          );
          setInStorage('english_first_name', JSON.stringify(transliteratedFirstName), )
          setInStorage('local_route', JSON.stringify('en'), sessionFlowName.GuestDiscussion);
          setLanguage('en');
          
          setLocalUserData(response?.data);
          navigate(ROUTES.SHIKSHALOKAM_VOICE_CHAT);
  
        } else {
          navigate(ROUTES.CHAUPAL_LOGIN_ROUTE);
          window.location.reload();
        }
      } else {
        let profileData = await getUserProfile(`?phone=${phoneNumberField}`);
        if (profileData && profileData?.results && profileData?.results?.length > 0){
          profileData = profileData?.results[0];
        }
        const userName = profileData?.first_name;
        const orgName = profileData?.org_associated;
        let profileAddress = profileData?.profile_address;
        
        if(userName && userName!=='') {
          setFirstName(userName);
        }
        if(orgName && orgName!=='') {
          setOrganizationName(orgName);
        }
        if(profileAddress && profileAddress.length>0) {
          const defaultStateVal = profileAddress[0]?.state;
          const defaultDistVal = profileAddress[0]?.district;
          let tempDistArray = []
          if(defaultStateVal && defaultStateVal!==''){
            const selectedState = stateLabelArray.find(item => item.label === defaultStateVal);
            if (selectedState) {
              setUserState({
                label: selectedState.label,
                value: selectedState.value
              });
              tempDistArray = await getDistrictLabelValue(selectedState.value)
            }
          }
          if(defaultDistVal && defaultDistVal!==''){
            console.log("defaultDistVal: ", defaultDistVal)
            console.log("tempDistArray: ", tempDistArray)
            const selectedDistrict = tempDistArray.find(item => item.label === defaultDistVal);
            console.log("selectedDistrict: ", selectedDistrict)
            if (selectedDistrict) {
              setUserDistrict({
                label: selectedDistrict.label,
                value: selectedDistrict.value
              });
            }
          }
        }
      }
      setIsLoading(false);
    } catch(e) {
      console.log("Error in submitForm", e)
      setIsLoading(false);
    }
    
  };

  const handleCheckboxChange = (e) => {
    setIsChecked(e?.target?.checked);
    resetFieldError();
  };

  return (
    <div className="container max-w-full md mt-0 justify-center h-screen overflow-y-auto">
      <div className="">
        <div className="justify-center w-full flex">
          <div className="w-full">
          <div className="justify-between w-full flex items-center p-2">
              <img
                src="https://static-media.gritworks.ai/fe-images/PNG/Shikshalokam/shikshagrahaLogo.png"
                className="h-[80px] w-[120px] sm:w-[150px] object-contain"
                alt="shikshalokam_logo"
              />
              <div className="w-[140px] flex justify-end p-2">
                <FormData
                  layOut={2}
                  labelName=""
                  id="pagelanguageID"
                  selectID="pagelanguageID"
                  selectName="language"
                  selectOptions={languageList}
                  labelDivClass="text-left text-slate-700"
                  selectValue={pageLanguage}
                  selectClassName="bg-white text-slate-600 rounded-3xl p-3 mt-0 outline outline-slate-300 outline-1 outline-offset min-w-0 w-full"
                  selectOnChange={handlePageLanguageChange}
                  isNumber={true}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sm:h-full sm:flex sm:flex-col sm:justify-center h-full sm:mt-20 md:mt-20">
          <div className="bg-slate-50 sm:pt-6 w-full sm:w-[75%] py-3 sm:m-auto rounded-3xl shadow-md border border-gray-300 mb-4">
              <>
                <div className="text-center sm:text-2xl text-xl text-md text-slate-700">
                  <b>{t('welcome_text')}</b>
              <p className="pt-1 pb-4 px-2 text-center text-lg">
                {t('welcome_paragraph2')}
              </p>
                </div>
              </>
            {(!getFromStorage('profileid'))? 
              <div className="p-2 text-center">
                <form id="myForm" onSubmit={submitForm}>
                    <>
                      <FormData layOut={1} isRequired={false}  labelName={`${t('phoneNumberQuestion')}`} id={idData?.phone} inputType="text" inputName="phoneNumber" placeholder={t('phoneNumberText')}
                        labelDivClass="text-left mt-6 ml-[4%] md:ml-[15%] font-normal text-md"
                        inputClass={`bg-white text-slate-600 rounded-md px-3 mt-1 outline outline-slate-300 outline-1 outline-offset w-[95%] md:w-[70%] min-h-[68px] ${errorFieldName?.phone&& 'border-[3px] border-solid border-red-500'}`}
                        micButtonClass="absolute right-[10%] sm:right-[10%] md:right-[17%] top-1/2 -translate-y-1/2 p-2 bg-none border-none cursor-pointer text-system-black text-xl sm:text-2xl"
                        inputOnChange={handlePhoneChange}
                        fieldError={errorFieldName?.phone? fieldError: null}
                        inputValue = {phoneNumberField}
                        showSpeaker={true}
                        isimportant={true}
                        showStarOnLeft={false}
                        showMic={true}
                        setInputValue={setPhoneNumberField}
                        isNumber={true}
                        langToUse={pageLanguage}
                        routeToUse={bot_routes.shikshalokam_chaupal}
                        resetFieldError={resetFieldError}
                        errorMessageClass="text-left ml-[7%] md:ml-[16%] text-red-500 text-md"
                      />
                      <div className="text-left text-slate-700 ml-[4%] md:ml-[18%] mt-6">
                        <label className="inline-block">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={handleCheckboxChange}
                            className={`w-5 h-5 border-2 border-slate-300 rounded-sm checked:bg-purple-600 checked:border-purple-600 focus:outline-none transition duration-300 transform scale-110 hover:scale-100 checked:scale-100 checked:transition-all align-middle ${errorFieldName?.tnc&& 'border-[3px] border-solid border-red-500 appearance-none'}`}
                          />
                          <span className="text-slate-700 ml-2">
                            {t('tncText1')}{' '}
                          </span>
                          <button href="/terms-and-conditions"
                          className="text-purple-600 hover:underline whitespace-nowrap"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open("/mohini"+ROUTES.TERMS_AND_CONDITIONS, "_blank");
                            // navigate(ROUTES.TERMS_AND_CONDITIONS);
                          }}
                          >
                          {' '}{t('tncText2')}
                          </button>
                          <span className="text-slate-700 ml-2">
                            {t('tncText3')}{' '}
                          </span>
                        </label>
                        {(fieldError && fieldError!== '' && errorFieldName?.tnc)&& 
                          <p className="text-left ml-[0%] md:ml-[0%] text-red-500 text-md">
                            {fieldError}
                          </p>
                        }

                      </div>
                    </>
                  
                  <div>
                    <label
                      id="error-form"
                      className="text-rose-600 mt-1 ml-[18%] mb-0"
                    ></label>
                  </div>
                  <div>
                    {/* <a href="#" className="no-underline"> */}
                    {(loginErrorMessage && loginErrorMessage !== '')&&(
                      <p className="text-red-500 font-bold text-sm">{loginErrorMessage}</p>
                    )}
                    <button
                      id="demo"
                      className=" p-3 mt-6 mb-2 px-3 py-3 text-white rounded-md"
                      style={{backgroundColor: "#572E91"}}
                      type="submit"
                    >
                      {t('continueButton')}
                    </button>
                    {/* </a> */}
                  </div>
                </form>
              </div>:
              <div className="p-2 text-center">
                <form id="myForm1" onSubmit={submitForm}>
                    <>
                      <FormData layOut={1} isRequired={false}  labelName={`${t('nameQuestion')}`} id={idData?.userName} inputType="text" inputName="nameQuestion" placeholder={t('nameQuestionPlaceholder')}
                        labelDivClass="text-left mt-6 ml-[4%] md:ml-[15%] font-normal text-md"
                        inputClass={`bg-white text-slate-600 rounded-md px-3 mt-1 outline outline-slate-300 outline-1 outline-offset w-[95%] md:w-[70%] min-h-[68px] ${errorFieldName?.userName&& 'border-[3px] border-solid border-red-500'}`}
                        micButtonClass="absolute right-[10%] sm:right-[10%] md:right-[17%] top-1/2 -translate-y-1/2 p-2 bg-none border-none cursor-pointer text-system-black text-xl sm:text-2xl"
                        inputOnChange={handleNameChange}
                        fieldError={errorFieldName?.userName? fieldError: null}
                        inputValue = {firstName}
                        showSpeaker={true}
                        isimportant={true}
                        showStarOnLeft={false}
                        showMic={true}
                        setInputValue={setFirstName}
                        langToUse={pageLanguage}
                        routeToUse={bot_routes.shikshalokam_chaupal}
                        resetFieldError={resetFieldError}
                        errorMessageClass="text-left ml-[7%] md:ml-[16%] text-red-500 text-md"
                      />
                      <FormData layOut={2} labelName={t('stateQuestion')} id={idData?.state} selectID="stateNameID" selectName="stateName"
                        selectOptions={stateLabelArray}
                        labelDivClass="text-left mt-6 ml-[4%] md:ml-[15%] font-normal text-md"
                        selectValue = {userState?.value}
                        selectClassName={`bg-white text-slate-600 rounded-md px-3 mt-1 outline outline-slate-300 outline-1 outline-offset w-[95%] md:w-[70%] min-h-[68px] ${errorFieldName?.state&& 'border-[3px] border-solid border-red-500'}`}
                        selectOnChange={handleStateChange}
                        fieldError={errorFieldName?.state? fieldError: null}
                        // isRequired={stateLabelArray?.length > 0 ? true : false}                 
                        showStarOnLeft={false}
                        isimportant={true}
                        showSpeaker={true}
                        langToUse={pageLanguage}
                        routeToUse={bot_routes.shikshalokam_chaupal}
                        errorMessageClass="text-left ml-[7%] md:ml-[16%] text-red-500 text-md"
                      />
                      <FormData layOut={2} 
                        labelName={t('districtQuestion')}
                        id={idData?.district} selectID="districtNameID" selectName="districtName"
                        selectOptions={districtLabelArray}
                        labelDivClass="text-left mt-6 ml-[4%] md:ml-[15%] font-normal text-md"
                        selectValue = {userDistrict?.value}
                        selectClassName={`bg-white text-slate-600 rounded-md px-3 mt-1 outline outline-slate-300 outline-1 outline-offset w-[95%] md:w-[70%] min-h-[68px] ${errorFieldName?.district&& 'border-[3px] border-solid border-red-500'}`}
                        selectOnChange={handleDistrictChange}
                        fieldError={errorFieldName?.district? fieldError: null}
                        // isRequired={districtLabelArray?.length > 0 ? true : false}
                        showStarOnLeft={false}
                        isimportant={true}
                        showSpeaker={true}
                        langToUse={pageLanguage}
                        routeToUse={bot_routes.shikshalokam_chaupal}
                        errorMessageClass="text-left ml-[7%] md:ml-[16%] text-red-500 text-md"
                      />
                      <FormData layOut={1} isRequired={false}  labelName={`${t('organizationQuestion')}`} id={idData?.organization} inputType="text" inputName="organizationQuestion" placeholder={t('organizationPlaceholder')}
                        labelDivClass="text-left mt-6 ml-[4%] md:ml-[15%] font-normal text-md"
                        inputClass={`bg-white text-slate-600 rounded-md px-3 mt-1 outline outline-slate-300 outline-1 outline-offset w-[95%] md:w-[70%] min-h-[68px] ${errorFieldName?.organization&& 'border-[3px] border-solid border-red-500'}`}
                        micButtonClass="absolute right-[10%] sm:right-[10%] md:right-[17%] top-1/2 -translate-y-1/2 p-2 bg-none border-none cursor-pointer text-system-black text-xl sm:text-2xl"
                        inputOnChange={handleOrganizationChange}
                        fieldError={errorFieldName?.organization? fieldError: null}
                        inputValue = {organizationName}
                        showSpeaker={true}
                        isimportant={true}
                        showStarOnLeft={false}
                        showMic={true}
                        setInputValue={setOrganizationName}
                        langToUse={pageLanguage}
                        routeToUse={bot_routes.shikshalokam_chaupal}
                        resetFieldError={resetFieldError}
                        errorMessageClass="text-left ml-[7%] md:ml-[16%] text-red-500 text-md"
                      />
                      <FormData layOut={1} isRequired={false}  labelName={`${t('numberOfPeopleQuestion')}`} id={idData?.numberOfPeople} inputType="text" inputName="numberOfPeopleQuestion" placeholder={t('numberOfPeoplePlaceholder')}
                        labelDivClass="text-left mt-6 ml-[4%] md:ml-[15%] font-normal text-md"
                        inputClass={`bg-white text-slate-600 rounded-md px-3 mt-1 outline outline-slate-300 outline-1 outline-offset w-[95%] md:w-[70%] min-h-[68px] ${errorFieldName?.numberOfPeople&& 'border-[3px] border-solid border-red-500'}`}
                        micButtonClass="absolute right-[10%] sm:right-[10%] md:right-[17%] top-1/2 -translate-y-1/2 p-2 bg-none border-none cursor-pointer text-system-black text-xl sm:text-2xl"
                        inputOnChange={handleNumberOfPeopleChange}
                        fieldError={errorFieldName?.numberOfPeople? fieldError: null}
                        inputValue = {numberOfPeople}
                        showSpeaker={true}
                        isimportant={true}
                        showStarOnLeft={false}
                        showMic={true}
                        setInputValue={setNumberOfPeople}
                        isNumber={true}
                        langToUse={pageLanguage}
                        routeToUse={bot_routes.shikshalokam_chaupal}
                        resetFieldError={resetFieldError}
                        errorMessageClass="text-left ml-[7%] md:ml-[16%] text-red-500 text-md"
                      />
                      <FormData layOut={3} isRequired={false}  labelName={`${t('dateDiscussionQuestion')}`} id={idData?.dateOfDiscussion} inputType="text" inputName="dateQuestion" placeholder={t('dateQuestionPlaceholder')}
                        labelDivClass="text-left mt-6 ml-[4%] md:ml-[15%] font-normal text-md"
                        inputClass={`bg-white text-slate-600 rounded-md px-3 mt-1 outline outline-slate-300 outline-1 outline-offset w-[95%] md:w-[70%] min-h-[68px] ${errorFieldName?.dateOfDiscussion&& 'border-[3px] border-solid border-red-500'}`}
                        micButtonClass="absolute right-[10%] sm:right-[10%] md:right-[17%] top-1/2 -translate-y-1/2 p-2 bg-none border-none cursor-pointer text-system-black text-xl sm:text-2xl"
                        inputOnChange={handleDateChange}
                        fieldError={errorFieldName?.dateOfDiscussion? fieldError: null}
                        inputValue = {dateOfDiscussion}
                        showSpeaker={true}
                        isimportant={true}
                        showStarOnLeft={false}
                        showMic={true}
                        setInputValue={setDateOfDiscussion}
                        langToUse={pageLanguage}
                        routeToUse={bot_routes.shikshalokam_chaupal}
                        resetFieldError={resetFieldError}
                        errorMessageClass="text-left ml-[7%] md:ml-[16%] text-red-500 text-md"
                      />
                      
                    </>
                  
                  <div>
                    <label
                      id="error-form"
                      className="text-rose-600 mt-1 ml-[18%] mb-0"
                    ></label>
                  </div>
                  <div>
                    {/* <a href="#" className="no-underline"> */}
                    {(loginErrorMessage && loginErrorMessage !== '')&&(
                      <p className="text-red-500 font-bold text-sm">{loginErrorMessage}</p>
                    )}
                    <button
                      id="demo"
                      className={`p-3 mt-6 mb-2 px-3 py-3 text-white rounded-md ${(getFromStorage('profileid'))? "w-[95%] md:w-[70%]":""}`}
                      style={{backgroundColor: "#572E91"}}
                      type="submit"
                    >
                      {(getFromStorage('profileid'))? t('LetGetStartedBtn'): t('continueButton')}
                    </button>
                    {/* </a> */}
                  </div>
                </form>
              </div>
            }
          </div>
        </div>
      </div>
      {isLoading&& 
        <div className="login-load-spinner">
          <div className="login-div67">
            <BiLoader className="login-rotate-loader login-loader-icon" />
          </div>
        </div> 
      }
    </div>
  );
}

export default ChaupalLogin;

/* eslint-disable react-hooks/exhaustive-deps */