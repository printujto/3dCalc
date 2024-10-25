import { useState } from 'react'
import './App.css'
import FormWithModel from './components/forms/FormWithModel.js'
import BasicForm from './components/forms/BasicForm.js'
import { Toaster } from 'react-hot-toast'
import { Button } from '@nextui-org/react'
import axios from 'axios'

function App() {
    const [uploadModel, setUploadModel] = useState(true)
    const [sendSuccess, setSendSuccess] = useState(false)

    if (sendSuccess) {
        return (
            <main className='flex flex-col items-center justify-center h-80'>
                <div className='sm:w-1/2 lg:w-1/3 w-full'>
                    <h1>Formulář úspěšně odeslán✅</h1>
                </div>
                <div>
                    <Button
                        onClick={() => {
                            setSendSuccess(false)
                        }}
                        className='mt-2 bg-gradient-to-tr from-violet from-30% to-pink text-white shadow-lg flex-1 text-lg font-semibold py-1'
                    >
                        <p>Počítat znovu</p>
                    </Button>
                </div>
            </main>
        )
    }

    return (
        <main className='flex flex-col items-center'>
            <Toaster></Toaster>

            <div className='sm:w-1/2 lg:w-1/3 w-full'>
                <h1 className='text-center'>Poptávka 3D tisku</h1>
                <div className='w-full flex items-center flex-col sm:flex-row gap-2 mt-4'>
                    <button
                        onClick={() => setUploadModel(true)}
                        className={`w-full ${
                            uploadModel
                                ? 'bg-violet hover:bg-violet-hover'
                                : 'text-black bg-white border-2 border-violet hover:bg-violet hover:bg-opacity-10 '
                        }`}
                    >
                        Mám 3d model
                    </button>
                    <button
                        onClick={() => setUploadModel(false)}
                        className={`w-full ${
                            uploadModel
                                ? 'text-black bg-white border-2 border-violet hover:bg-violet hover:bg-opacity-10 '
                                : 'bg-violet hover:bg-violet-hover'
                        }`}
                    >
                        Poptat bez modelu
                    </button>
                </div>

                {uploadModel ? (
                    <FormWithModel
                        handleSendSuccess={(state) => setSendSuccess(state)}
                    ></FormWithModel>
                ) : (
                    <BasicForm></BasicForm>
                )}
            </div>
        </main>
    )
}

export default App
