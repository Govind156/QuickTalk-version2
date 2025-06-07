import {useDispatch,useSelector} from 'react-redux'
import {useNavigate} from 'react-router-dom'
import { setUser } from '../../../redux/usersSlice'
import { toast } from "react-hot-toast";
import { useEffect,useState } from 'react'
import { updateUserThemePreference } from '../../../apiCalls/user';
function Header({socket}){
    const {user}=useSelector(state=>state.userReducer)
    const navigate=useNavigate()
    const dispatch=useDispatch()
    const [darkMode, setDarkMode] = useState(user?.themePreference === 'dark');
   
    useEffect(() => {
        // Notify server when component mounts (page refresh)
        if (socket && user?._id) {
          socket.emit('user-login', user._id);
        }
    
        return () => {
          // Cleanup on unmount
          if (socket && user?._id) {
            socket.emit('user-offline', user._id);
          }
        };
      }, [socket, user])
     //Apply theme on initial load and when user changes
    
     useEffect(() => {
        applyTheme(darkMode);
    }, [darkMode]);
    

    const toggleTheme = async () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        applyTheme(newDarkMode);
        
        // Save preference to server if user is logged in
        if (user?._id) {
            try {
                const theme = newDarkMode ? 'dark' : 'light';
                await updateUserThemePreference(user._id, theme);
                // Update user in redux store
                dispatch(setUser({
                    ...user,
                    themePreference: theme
                }));
            } catch (error) {
                toast.error("Failed to save theme preference");
                console.error(error);
            }
        }
    };

    const applyTheme = (isDark) => {
        const root = document.documentElement;
        if (isDark) {
            root.style.setProperty('--primary-bg', '#1a1a2e');
            root.style.setProperty('--secondary-bg', '#16213e');
            root.style.setProperty('--text-color', '#ffffff');
            root.style.setProperty('--header-bg', '#0f3460');
            root.style.setProperty('--message-send', '#4e4e8a');
            root.style.setProperty('--message-receive', '#2c2c54');
            root.style.setProperty('--input-bg', '#2c2c54');
            root.style.setProperty('--logout-btn-color','#ffffff')

            root.style.setProperty('--input-text','#333333')
            root.style.setProperty('--header-text','#ffffff')
            root.style.setProperty('--chat-bg','#1a1a2e')
            root.style.setProperty('--message-sent-bg','#4e4e8a')
            root.style.setProperty('--message-sent-text','#ffffff')
            root.style.setProperty('--message-received-bg','#2c2c54')
            root.style.setProperty('--message-received-text','#ffffff')
          
            root.style.setProperty('--scheduled-bg','#16213e')
            root.style.setProperty('--scheduled-card-bg','#0f3460')
            // root.style.setProperty('--scheduled-text','#333333')
            root.style.setProperty('--scheduled-text','#0f3460')
            root.style.setProperty('--scheduled-border','#4e4e8a')
            root.style.setProperty('--logo-color','#e74e3c')
            root.style.setProperty('--username-color','#ffffff')
            root.style.setProperty('--input-text','#ffffff')
            root.style.setProperty('--border-color','#e0e0e0')
            root.style.setProperty('--searchlist-bg','#1a1a2e')
            root.style.setProperty('--searchlist-item-bg','#16213e')
            root.style.setProperty('--searchlist-selected-bg','#0f3460')
            root.style.setProperty('--searchlist-text','#ffffff')
            root.style.setProperty('--searchlist-border','#2c2c54')
            root.style.setProperty('--searchlist-btn-bg','#4e4e8a')
            root.style.setProperty('--searchlist-btn-text','#ffffff')
            root.style.setProperty('--online-indicator','#58d68d')
        } else {
            root.style.setProperty('--primary-bg', '#ffffff');
            root.style.setProperty('--secondary-bg', '#f5f5f5');
            root.style.setProperty('--text-color', '#333333');
            root.style.setProperty('--header-bg', '#e74e3c');
            root.style.setProperty('--message-send', '#e74e3c');
            root.style.setProperty('--message-receive', '#f1f1f1');
            root.style.setProperty('--input-bg', '#ffffff');
            root.style.setProperty('--input-text','#333333')
            root.style.setProperty('--logout-btn-color','#333333')
            root.style.setProperty('--header-text','#ffffff')
            root.style.setProperty('--chat-bg','#f9f9f9')
            root.style.setProperty('--message-sent-bg','#e74e3c')
            root.style.setProperty('--message-sent-text','#ffffff')
            root.style.setProperty('--message-received-bg','#978989')
            root.style.setProperty('--message-received-text','#333333')
          
            root.style.setProperty('--scheduled-bg','#ffffff')
            root.style.setProperty('--scheduled-card-bg','#ffffff')
            root.style.setProperty('--scheduled-text','#333333')
            root.style.setProperty('--scheduled-border','#e0e0e0')
            root.style.setProperty('--logo-color','#ffffff')
            root.style.setProperty('--username-color','#333333')
            root.style.setProperty('--input-text','#333333')
            root.style.setProperty('--border-color','#e0e0e0')
            root.style.setProperty('--searchlist-bg','#ffffff')
            root.style.setProperty('--searchlist-item-bg','#f5f5f5')
            root.style.setProperty('--searchlist-selected-bg','#e0e0e0')
            root.style.setProperty('--searchlist-text','#333333')
            root.style.setProperty('--searchlist-border','#e0e0e0')
            root.style.setProperty('--searchlist-btn-bg','#e74e3c')
            root.style.setProperty('--searchlist-btn-text','#ffffff')
            root.style.setProperty('--online-indicator','#82e0aa')


        }
    }

    
    function getfullname() {
        let fname = user?.firstName?.toUpperCase() || "";
        let lname = user?.LastName?.toUpperCase() || "";
        return fname + " " + lname;
    }
    function getinitials(){
        let f=user?.firstName.toUpperCase()[0]
        let l=user?.LastName.toUpperCase()[0]
        return f+l;
    }
    function formatName(user){
        let fname=user?.firstName.at(0).toUpperCase()+user?.firstName.slice(1).toLowerCase();
        let lname=user?.LastName.at(0).toUpperCase()+user?.LastName.slice(1).toLowerCase();
        return fname+" "+lname
    }
   
    const logout = () => {
        if (socket && user?._id) {
          socket.emit('user-offline', user._id);
        }
        localStorage.removeItem('token');
        dispatch(setUser(null));
        toast.success("Logged out successfully");
        navigate('/login');
      };
    useEffect(() => {
        if (socket) {
            socket.on('profile-pic-updated', (data) => {
                if (data.userId === user._id) {
                    // Update the user in redux store
                    dispatch(setUser({
                        ...user,
                        ProfilePic: data.profilePic
                    }));
                }
            });
        }
    
        return () => {
            if (socket) {
                socket.off('profile-pic-updated');
            }
        };
    }, [socket, user, dispatch]);

    return (
        <div className="app-header">
    <div className="app-logo">
        <i className="fa fa-comments" aria-hidden="true"></i>
          Quick Talk
    </div>
    <div className="app-header-controls">
                <button 
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {darkMode ? (
                        <i className="fa fa-sun-o" aria-hidden="true"></i>
                    ) : (
                        <i className="fa fa-moon-o" aria-hidden="true"></i>
                    )}
                </button> 
    <div className="app-user-profile">
        {
        user?.ProfilePic && 
        <img src={user?.ProfilePic} alt='profile-pic' className="logged-user-profile-pic" 
        onClick={()=>navigate('/profile')}>
        </img>}
        {!user?.ProfilePic && 
        <div className="logged-user-profile-pic" onClick={()=>navigate('/profile')}>{getinitials()}
        </div>}
        <div className="logged-user-name">{formatName(user)}</div>
        <button className='logout-btn' onClick={logout}>
            <i className='fa fa-power-off'></i>
        </button>
    </div>
   </div> 
 </div>
    )
}
export default Header;
