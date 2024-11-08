import Cloud from '../assets/Cloud.gif'

const UploadingScreen = () => {
    return (
        <div className='flex flex-col items-center justify-center'>
            <img
                className='filter:brightness(100) filter: contrast-200'
                width={50}
                src={Cloud}
                alt='Uploading gif'
            />
            <p>Nahrávají se vaše soubory</p>
            <p>Prosíme nevypínejte prohlížeč</p>
        </div>
    )
}

export default UploadingScreen
