import Cloud from '../assets/Cloud.gif'

const UploadingScreen = () => {
    return (
        <div className='flex flex-col items-center justify-center text-gray-500'>
            <img width={50} src={Cloud} alt='Uploading gif' />
            <p>Nahrávají se vaše soubory</p>
            <p>Prosím nevypínejte prohlížeč</p>
        </div>
    )
}

export default UploadingScreen
