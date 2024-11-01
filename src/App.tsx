import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Calculator from './pages/Calculator.js'
import DemandForm from './pages/DemandForm.js'
import PageNotFound from './pages/PageNotFound.js'

function App() {
    return (
        <BrowserRouter>
            <main className='flex flex-col items-center bg-transparent'>
                <Routes>
                    <Route path='' element={<Calculator></Calculator>}></Route>
                    <Route
                        path='*'
                        element={<PageNotFound></PageNotFound>}
                    ></Route>
                    <Route
                        path='poptavka'
                        element={<DemandForm></DemandForm>}
                    ></Route>
                </Routes>
            </main>
        </BrowserRouter>
    )
}

export default App
