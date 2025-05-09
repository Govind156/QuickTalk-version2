import React from "react";
import {Link,useNavigate} from 'react-router-dom'
import { signupUser } from "../../apiCalls/auth";
import { useState } from "react";
import {toast} from 'react-hot-toast'
import { hideLoader, showLoader } from "../../redux/loaderSlice";
import { useDispatch } from "react-redux";
function Signup(){
    const dispatch=useDispatch()
    const navigate = useNavigate();
    const [message, setMessage] = useState(""); // State for message box
    const [user,setUser]=React.useState({
        firstName:'',
        LastName:'',
        email:'',
        password:'',
    })

    async function onformSubmit(e) {

        e.preventDefault();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|edu|gov|in)$/;
        if (!emailRegex.test(user.email)) {
          toast.error("INVALID EMAIL FORMAT OR THIS DOMAIN NAME  NOT ACCEPTABLE");
            return;
        }
        let response = null;
        try {
            dispatch(showLoader())
            response = await signupUser(user);
            dispatch(hideLoader());
            if (response.success) {
              setMessage(`We've sent a verification code to ${user.email}`);
              setTimeout(() => {
                navigate("/VerifySignup"); // Redirect using navigate
              }, 4000); // Delay for 2 seconds before redirecting
            } else {
              toast.error(response.message);
            }
          } catch (error) {
            toast.error(error.message);
          }
    }


    return (
        <div className="container">
        <div className="container-back-img"></div>
        <div className="container-back-color"></div>
        <div className="card">
            <div className="card_title">
                <h1>Create Account</h1>
            </div>
            <div className="form">
                <form onSubmit={onformSubmit}>
                    <div className="column">
                        <input type="text" placeholder="First Name"  
                        value={user.firstName}
                        onChange={(e)=>{setUser({...user,firstName:e.target.value})}}/>
                        <input type="text" placeholder="Last Name" 
                        value={user.LastName}
                        onChange={(e)=>{setUser({...user,LastName:e.target.value})}}/>
                    </div>
                    <input type="email" placeholder="Email" 
                    value={user.email}
                    onChange={(e)=>{setUser({...user,email:e.target.value})}}/>
                    <input type="password" placeholder="Password" 
                    value={user.password}
                    onChange={(e)=>{setUser({...user,password:e.target.value})}}
                    />
                    <button>Sign Up</button>
                </form>
            </div>
            <div className="card_terms">
                <span>Already have an account?
                    <Link to="/login">Login Here</Link>
                </span>
            </div>

        </div>
        {message && (
          <div className="message-box">
            <p>{message}</p>
          </div>
        )}
    </div>
    )
}

export default Signup;