import React from "react";
import {Link,useNavigate} from 'react-router-dom'
import { verifysignup} from "../../apiCalls/auth";
import {toast} from 'react-hot-toast'
import {useDispatch} from 'react-redux'
import { hideLoader, showLoader } from "../../redux/loaderSlice";
function VerifySignup(){
    const navigate = useNavigate();
    const dispatch=useDispatch()
    const [code,setcode]=React.useState({
        verificationcode:'',
    })

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
        </div>
    </div>
    )
}

export default VerifySignup;