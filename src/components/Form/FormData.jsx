import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from "react-icons/hi2";
import Notification from "../ToastMessage/TotastMessage";
import { handleOnSpeaking, handleOnStopSpeaking, startRecording, stopRecording } from "../../services/audio_service";
import { FiMic, FiMicOff } from "react-icons/fi";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';


function FormData({selectOptions, selectClassName, selectName, selectOnChange, selectID, selectValue, inputDivClass, isRequired, inputType, inputName, id,
    inputClass, inputOnChange, inputValue, setInputValue, labelDivClass, labelClass, labelName, layOut, isimportant, isMultiple, showWithinInput=false,
    withinInputType, withinInputName, withinInputOnChange, withinInputValue, withinInputClass, withinInputDisabled, fieldError, showDefaultDropdownText=true, placeholder='',
    showSpeaker=false, showStarOnLeft=true, showMic=false, micButtonClass, isNumber=false, langToUse, routeToUse, errorMessageClass, resetFieldError, errorFieldRefs
}){
    let optionArr = selectOptions;
    let multipleValue = false;
    if(isMultiple === 'true') multipleValue = true;
    const audioRef = useRef();
    const [audioCache, setAudioCache] = useState({});

    const [isPlaying, setIsPlaying] = useState(false);
    const [hasStartedRecording, setHasStartedRecording] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);

    const [showCalendar, setShowCalendar] = useState(false);
    const [inputDate, setInputDate] = useState(null);


    const { t } = useTranslation();
    
    let defaultText = 'Choose an option'

    if (t('chooseAnOption') && !showDefaultDropdownText) {
        defaultText = t('chooseAnOption')
    }
    const calendarRef = useRef();
    const [scale, setScale] = useState(1);

    useEffect(()=>{
        setAudioCache({});
        audioRef.current=null;
    }, [langToUse])

    useEffect(() => {
        const updateScale = () => {
          const screenWidth = window.innerWidth;
          const calendarWidth = 420
          const maxScale = 1;
          const minScale = 0.5;
          const newScale = Math.min(maxScale, Math.max(minScale, screenWidth / calendarWidth));
          setScale(newScale);
        };
      
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
      }, []);

    useEffect(() => {
        if(!showCalendar) return;
        function handleClickOutside(event) {
          if (calendarRef.current && !calendarRef.current.contains(event.target)) {
            setShowCalendar(false);
          }
        }
    
        if (showCalendar) {
          document.addEventListener("mousedown", handleClickOutside);
        } else {
          document.removeEventListener("mousedown", handleClickOutside);
        }
    
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [showCalendar]);

    const formatDate = (date) => {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };
    
    function showDropDown(){
        if(optionArr === undefined || optionArr === null) optionArr = []; 
        return(
            <>
                <select
                  className={selectClassName}
                  name={selectName}
                  onChange={selectOnChange}
                  id={selectID}
                  value={selectValue}
                  multiple={multipleValue}
                  {...(isRequired && { required: true })}
                >
                    <option value="" disabled hidden>{t('chooseAnOption')}</option>
                    {(optionArr).map((option) => {
                        return (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        );
                    })}
                </select>
            </>
        );
    }

    function showInput(){
        return(
            <>
                <div className={inputDivClass}>
                    <>
                        {/* {(fieldError && fieldError!== '')&& <p className={errorMessageClass}>{fieldError}</p>} */}
                        <div className="relative w-full">
                            <input
                                type={inputType}
                                name={inputName}
                                id={id}
                                className={`${inputClass} ${showMic ? 'pr-2' : ''}`}
                                onChange={inputOnChange}
                                value={inputValue}
                                // required
                                {...(isRequired ? { required: true } : {})}
                                placeholder={hasStartedRecording? 
                                    t('placeholder1'): 
                                    isFetchingData? t('placeholder2'): placeholder
                                }
                                disabled={isFetchingData || hasStartedRecording}
                            />
                            {showMic && (
                                <button
                                    type="button"
                                    className={micButtonClass}
                                    onClick={()=>{
                                        if (hasStartedRecording) {
                                            if(resetFieldError) resetFieldError();
                                            stopRecording(setHasStartedRecording, mediaRecorder);
                                        } else {
                                            startRecording(
                                                setMediaRecorder, setHasStartedRecording, setIsFetchingData, t, setInputValue, audioRef, setIsPlaying, 
                                                langToUse, routeToUse, isNumber
                                            );
                                        }
                                    }}
                                    disabled={isFetchingData}
                                >
                                    {hasStartedRecording ? <FiMicOff /> : <FiMic />}
                                </button>
                            )}
                        </div>
                    </>
                </div>
            </>
        );
    }

    function showStar(){
        if(isimportant === "true" || isimportant) return (<span style={{color: "red"}}>* </span>);
    }

    function showLabel(){
        return (
            <div className={`flex items-center gap-2 ${labelDivClass}`} ref={errorFieldRefs}>
                {showSpeaker && (
                    <span className="speaker-div">
                        {isPlaying ? (
                            <button
                                type="button"
                                className="speaker-off-button"
                                onClick={() => handleOnStopSpeaking(audioRef, setIsPlaying)}
                            >
                                <HiOutlineSpeakerWave />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="speaker-off-button"
                                onClick={() => {
                                    setIsPlaying(true);
                                    handleOnSpeaking(labelName, id, langToUse, audioRef, audioCache, setAudioCache, setIsPlaying);
                                }}
                            >
                                <HiOutlineSpeakerXMark />
                            </button>
                        )}
                    </span>
                )}
                <label htmlFor={id} className={labelClass}>
                    {showStarOnLeft ? <>{showStar()}{labelName}</> : <>{labelName} {showStar()}</>}
                </label>
            </div>
        );
    }

    function showCalenderInput() {
        return (
          <div className={inputDivClass}>
            {/* {(fieldError && fieldError !== '') && <p className={errorMessageClass}>{fieldError}</p>} */}
            <div className="relative w-full">
              <input
                type="text"
                name={inputName}
                id={id}
                className={inputClass}
                value={inputValue}
                onChange={inputOnChange}
                onFocus={() => setShowCalendar(true)}
                readOnly
                placeholder={placeholder}
              />
              {showCalendar && (
                <div className="relative z-10 mt-2 flex justify-left ml-[2%] md:ml-[15%]" 
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    width: 'fit-content',
                  }}
                >
                    <div ref={calendarRef}>
                        <Calendar
                            calendarType = 'iso8601'
                            showNeighboringMonth={false}
                            maxDate={new Date()}
                            onClickDay={(day)=>{
                                if(resetFieldError) resetFieldError();
                                const formatted = formatDate(day);
                                setInputValue(formatted);
                                setInputDate(day);
                                console.log("formatted Day: ", formatted)
                                console.log("Day: ", day)
                                setShowCalendar(false);
                            }}
                            value={inputDate || new Date()}
                        />
                    </div>
                </div>
              )}
            </div>
          </div>
        );
    }
    
 
    if(layOut === 1){
        return(
            <>
                <Notification />
                {showLabel()}
                {(fieldError && fieldError!== '')&& <p className={errorMessageClass}>{fieldError}</p>}
                {showInput()}
            </>
        );
    } else if(layOut === 2){
        return(
            <>
                <Notification />
                {showLabel()}
                {(fieldError && fieldError!== '')&& <p className={errorMessageClass} ref={errorFieldRefs}>{fieldError}</p>}
                {showDropDown()}
            </>
        );
    } else if(layOut === 3){
        return(
            <>
                <Notification />
                {showLabel()}
                {(fieldError && fieldError!== '')&& <p className={errorMessageClass} ref={errorFieldRefs}>{fieldError}</p>}
                {showCalenderInput()}
            </>
        );
    } else{
        return(
            <>
                <Notification />
            </>
        );
    }
}

export default FormData;
