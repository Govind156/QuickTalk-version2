import React ,{useState,useEffect}from "react";
import {Link,useNavigate} from 'react-router-dom'
import { verifysignup,Resendverifycode} from "../../apiCalls/auth";
import {toast} from 'react-hot-toast'
import {useDispatch} from 'react-redux'
import { hideLoader, showLoader } from "../../redux/loaderSlice";
function VerifySignup(){
    const navigate = useNavigate();
    const dispatch=useDispatch()
    const [code,setcode]=React.useState({
        verificationcode:'',
    })
    
    const [showResendBox,setshowResendBox]=useState(false)
    const [resendEmail,setResendEmail]=useState("")
    const [loadingResend,setLoadingResend]=useState(false)
    const [cooldown,setCooldown]=useState(0)

    async function onformSubmit(e) {
            e.preventDefault();
            let response = null;
            try {
                dispatch(showLoader())
                response=await verifysignup(code);
                dispatch(hideLoader())
                if (response.success) {
                    toast.success(response.message);
                    navigate("/login");  // Correct route
                } else {
                    toast.error(response.message);
                }
            } catch (error) {
                toast.error(response.message);
            }
    }

    async function handleResend(){
        if(!resendEmail){
            toast.error("Please enter your Email");
            return;
        }
        setLoadingResend(true);
        try{
           setCooldown(600);
           localStorage.setItem("cooldownUntil",Date.now()+600*1000);
           dispatch(showLoader());
           const response=await Resendverifycode({email:resendEmail});
           dispatch(hideLoader());
           toast.success("verification resend code sent successfully");
           setshowResendBox(false);
           setResendEmail("");
        }
        catch(error){
            dispatch(hideLoader());
            toast.error("failed to resend");
        }
        finally{
            setLoadingResend(false)
        }
    }


    useEffect(()=>{
        const savedUntil=localStorage.getItem("cooldownUntil")
        if(!savedUntil)
            return;
        const remaining=Math.floor((savedUntil-Date.now())/1000)
        if(remaining>0){
          setCooldown(remaining)
        }else{
          localStorage.removeItem("cooldownUntil");
        }
    },[])

    useEffect(()=>{
      if(cooldown<=0){
        return;
      }
      const timer=setInterval(()=>{
        setCooldown((prev)=>prev-1)
      },1000)
      return ()=>clearInterval(timer);
    },[cooldown])


    return (
        <div className="container">
        <div className="container-back-img"></div>
        <div className="container-back-color"></div>
        <div className="card">
            <div className="card_title">
                <h1>Verify Your Email</h1>
            </div>
            <div className="form">
                <form onSubmit={onformSubmit}>
                    <div className="verifycodeinput">
                        <input type="text" placeholder="Enter your verificationcode"  
                        value={code.verificationcode}
                        onChange={(e)=>{setcode({...code,verificationcode:e.target.value})}}/>
                    </div>
                    <button>Verify Me</button>
                </form>
            </div>
            <div style={{marginTop:"15px",textAlign:"center"}}>
              <span
               onClick={()=>{
                if(cooldown ===0)
                    setshowResendBox(!showResendBox)
               }}
               style={{
                color:cooldown>0 ? "#999" :"#007bff",
                cursor:cooldown>0 ? "not-allowed":"pointer",
                textDecoration:"underline",
                fontSize:"14px"
               }}
              >
               {cooldown>0?`Resend avaiable in ${cooldown}s`:"Didn't receive the code?Resend"}
              </span>
            </div>
            {
                showResendBox && (
                    <div className={`resend-box ${showResendBox?"show":""}`}>
                    <input
                     type="email"
                     autoFocus
                     placeholder="Enter Your Email"
                     value={resendEmail}
                     onChange={(e)=>setResendEmail(e.target.value)}
                     style={{marginTop:"20px",padding:"6px",width:"100%"}}
                    />
                    <br/>
                    <button
                     onClick={handleResend}
                     disabled={loadingResend}
                     className="resendButton"
                    >
                        Send Code
                    </button>
                    </div>
                )
            }
        </div>
    </div>
    )
}

export default VerifySignup;