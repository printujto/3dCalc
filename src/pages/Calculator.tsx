import { Button } from '@nextui-org/react'
import FormWithModel from '../components/forms/FormWithModel'
import UploadingScreen from '../components/UploadingScreen'
import { useState } from 'react'
import SuccessScreen from '../components/SuccessScreen'

const Calculator = () => {
    const [sendSuccess, setSendSuccess] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    if (isUploading)
        return (
            <main className='flex flex-col items-center justify-center h-80'>
                <UploadingScreen></UploadingScreen>
            </main>
        )

    if (sendSuccess) {
        return (
            <main className='flex flex-col items-center justify-center h-80'>
                <SuccessScreen></SuccessScreen>
            </main>
        )
    }
    return (
        <FormWithModel
            handleSendSuccess={(state) => setSendSuccess(state)}
            handleIsUploading={(state) => setIsUploading(state)}
        ></FormWithModel>
    )
}

export default Calculator
