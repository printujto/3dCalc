import { useState } from 'react'
import { loadOBJModel, loadSTLModel } from './utils/loadModel.js'
import getPrice from './utils/getPrice.js'

type modelParams = {
    volume: string
    dimensions: {
        x: number
        y: number
        z: number
    }
}

import './App.css'
import FormWithModel from './components/forms/FormWithModel.js'
import BasicForm from './components/forms/BasicForm.js'

function App() {
    const [uploadModel, setUploadModel] = useState(true)

    return (
        <main className='flex flex-col items-center'>
            <div className='sm:w-96 w-full'>
                <h1 className='text-center'>Poptávkový formulář</h1>
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
                    <FormWithModel></FormWithModel>
                ) : (
                    <BasicForm></BasicForm>
                )}
            </div>
        </main>
    )
}

export default App
