import {useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {Link,useNavigate} from 'react-router-dom'
import { logInUser } from '../../apiCalls/auth';
import {toast} from 'react-hot-toast'
import { hideLoader, showLoader } from '../../redux/loaderSlice';
function Login({socket}){
    const dispatch=useDispatch()
    const navigate=useNavigate();
    const [user,setUser]=useState({
        email:'',
        password:''
    })

    async function onformSubmit(e){
       e.preventDefault();
       let response=null;
       try{
         dispatch(showLoader())
         response=await logInUser(user);
         dispatch(hideLoader())
         if(response.success){
           toast.success(response.message);
           localStorage.setItem('token',response.token)
           window.location.href="/";

         }else{
           toast.error(`${response.message}`);
           if(response.message === "Account not verified"){
            setTimeout(() => {
                navigate("/VerifySignup"); 
              }, 4000); // Delay for 2 seconds before redirecting
           }

         }
       }
       catch(error){
        toast.error(`hello-${response.message || error.message}`)
       }
    }

    return (
    <div className="container">
        <div className="container-back-img"></div>
        <div className="container-back-color"></div>
        <div className="card">
        <div className="card_title">
            <h1>Login Here</h1>
        </div>
        <div className="form">
        <form onSubmit={onformSubmit}>
            <input type="email" 
            placeholder="Email"
            value={user.email}
            onChange={(e)=>{setUser({...user,email:e.target.value})}}/>
            <input 
            type="password" 
            placeholder="Password" 
            value={user.password}
            onChange={
                (e)=>{setUser({...user,password:e.target.value})}
            }/>
            <button>Login</button>
        </form>
        </div>
        <div className="card_terms"> 
            <span>Don't have an account yet?
                <Link to='/signup'>Signup Here</Link>
            </span>
        </div>
        </div>
    </div>
    )
}
export default Login;




