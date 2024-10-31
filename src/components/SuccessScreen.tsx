import { Button } from '@nextui-org/react'
import Success from '../assets/Success.gif'

const SuccessScreen = () => {
    return (
        <>
            <img src={Success} width={100} alt='Success gif' />
            <div>
                <h1 className='text-center'>Formulář úspěšně odeslán</h1>
            </div>
            <div>
                <Button
                    onClick={() => {}}
                    className='mt-2 bg-gradient-to-tr from-violet from-30% to-pink text-white shadow-lg flex-1 text-lg font-semibold py-1'
                >
                    <p onClick={() => location.reload()}>Počítat znovu</p>
                </Button>
            </div>
        </>
    )
}

export default SuccessScreen
