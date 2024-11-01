import React from 'react'
import ModelIcon from '../assets/ModeIcon'
import CrossIcon from '../assets/CrossIcon'

const FormFileCard = ({
    file,
    id,
    handleDelete,
}: {
    file: File
    id: number
    handleDelete: (
        id: number,
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => void
}) => {
    return (
        <div
            id={id.toString()}
            className='p-2 flex items-center gap-4 shadow-md bg-white/90 hover:bg-white duration-200 w-fit rounded-xl'
        >
            <ModelIcon className='fill-gray-400 w-10'></ModelIcon>
            <div className='flex flex-col break-all'>
                {file.name.length > 45
                    ? file.name.slice(0, 45) + '...'
                    : file.name}
                <span className='text-gray-500 text-sm'>
                    {Math.floor(file.size / 100) / 10} kb
                </span>
            </div>

            <div className='p-1' onClick={(event) => handleDelete(id, event)}>
                <CrossIcon className='w-6 fill-red-500 hover:fill-red-600 duration-200'></CrossIcon>
            </div>
        </div>
    )
}

export default FormFileCard
