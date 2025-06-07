import {BrowserRouter,Route,Routes} from 'react-router-dom'
import Profile from './pages/Profile'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Loader from './components/Loader'
import VerifySignup from './pages/VerifySignup'
import {Toaster} from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import {useSelector} from 'react-redux'
import {io} from 'socket.io-client' 
import { ChakraProvider ,extendTheme} from '@chakra-ui/react';
const theme = extendTheme({});
const socket=io('https://quicktalk-version2-server.onrender.com/')
function App(){
   const {loader}=useSelector(state=>state.loaderReducer)
  return (
    <ChakraProvider theme={theme}>
    <div>
      <Toaster postion="top-center" reverseOrder={false} />
      {loader && <Loader/>}
      <BrowserRouter>
       <Routes>
        <Route path='/' element={
          <ProtectedRoute>
            <Home/>
          </ProtectedRoute>
          }>
        </Route>
        <Route path='/profile' element={
          <ProtectedRoute>
            <Profile socket={socket}/>
          </ProtectedRoute>
        }>
        </Route>
        <Route path='/login' element={<Login socket={socket}/>}></Route>
        <Route path='/Signup' element={<Signup/>}></Route>
        <Route path="/verifysignup" element={<VerifySignup />} />
       </Routes>
      </BrowserRouter>
    </div>
    </ChakraProvider>
  )
}
export default App;