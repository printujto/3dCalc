import React from 'react'
import ModelCard from '../ModelCard'
import { useState } from 'react'
import { loadOBJModel, loadSTLModel } from '../../utils/loadModel'
import getPrice from '../../utils/getPrice'
import { SelectItem, Select, Input, Button } from '@nextui-org/react'

type modelParams = {
    volume: number
    surface: number
    dimensions: { x: number; y: number; z: number }
}

const FormWithModel = () => {
    const [formErr, setFormErr] = useState('')
    const [model, setModel] = useState<File>()

    const [modelParams, setModelParams] = useState<modelParams | null>(null)

    const [material, setMaterial] = useState('PLA')
    const [modelQuality, setModelQuality] = useState('low')
    const [surfaceQuality, setSurfaceQuality] = useState('rough')

    const [modelColor, setModelColor] = useState('black')
    const [enviroment, setEnviroment] = useState('in')
    const [count, setCount] = useState(0)

    // console.log(modelQuality)
    // console.log(surfaceQuality)
    // console.log(material)
    // console.log(enviroment)
    // console.log('Count:' + count)
    console.log(modelParams)

    const showResult = () => {
        if (!model) {
            console.log('nebyl zadan objekt')
            setFormErr('Nahrajte 3d objekt')
        } else if (
            !modelQuality ||
            !enviroment ||
            !surfaceQuality ||
            !material
        ) {
            console.log('chybicka')
            setFormErr('Vyplňte všechny povinné údaje')
        } else if (count <= 0) {
            console.log('Zadej pocet')
            setFormErr('Zadejte počet kusů')
        } else {
            setFormErr('')

            //TODO: checnout jestli chodi data
            getModelParams(model)

            // const weight = getPrice(modelParams, material, inFill)
        }
    }

    const getModelParams = (model: File) => {
        if (!model) return

        const reader = new FileReader()

        const extension = model.name.split('.').pop().toLowerCase()

        console.log(extension)

        if (extension === 'obj') {
            reader.readAsText(model)
        } else if (extension === 'stl') {
            reader.readAsArrayBuffer(model)
        } else {
            setFormErr('Nepodporovaný formát')
        }

        reader.onload = function (e: ProgressEvent<FileReader>) {
            if (extension === 'obj') {
                if (e.target === null) return

                const { totalVolume, totalSurfaceArea, dimensions } =
                    loadOBJModel(e.target.result)

                setModelParams({
                    volume: totalVolume,
                    surface: totalSurfaceArea,
                    dimensions,
                })
            } else if (extension === 'stl') {
                if (e.target === null) return

                const { totalVolume, surfaceArea, dimensions } = loadSTLModel(
                    e.target.result
                )

                setModelParams({
                    volume: totalVolume,
                    surface: surfaceArea,
                    dimensions,
                })
            } else {
                setFormErr('Nepodporovaný formát')

                alert('Nepodporovaný formát')
            }
        }
    }
    console.log(modelParams)

    return (
        <form
            className='flex flex-col gap-2 mt-4'
            // onSubmit={(e) => submitForm(e)}
        >
            <div className='flex items-center justify-center w-full'>
                {!model ? (
                    <label
                        htmlFor='dropzone-file'
                        className='flex flex-col items-center justify-center w-full h-52 border-2 border-gray-400 border-dashed rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-200 duration-200'
                    >
                        <>
                            <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                                <svg
                                    className='w-8 h-8 mb-4 text-gray-500 dark:text-gray-400'
                                    aria-hidden='true'
                                    xmlns='http://www.w3.org/2000/svg'
                                    fill='none'
                                    viewBox='0 0 20 16'
                                >
                                    <path
                                        stroke='currentColor'
                                        d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
                                    />
                                </svg>
                                <p className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
                                    <span className='font-semibold'>
                                        Nahrát 3D model
                                    </span>
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400'>
                                    .OBJ, .STL (MAX. 800x400px)
                                </p>
                            </div>

                            <input
                                required
                                onChange={(e) => {
                                    if (
                                        !e.target.files ||
                                        e.target.files.length < 1
                                    )
                                        return
                                    setModel(e.target.files[0])
                                }}
                                type='file'
                                accept='.obj, .stl, .stp'
                                name='file'
                                id='dropzone-file'
                                className='hidden'
                            />
                        </>
                    </label>
                ) : (
                    <div className='p-4 w-full h-52 border-2 border-gray-400 border-dashed rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-200 duration-200'>
                        <ModelCard
                            handleDelete={() => {
                                setModel(undefined)
                                setModelParams(null)
                            }}
                            model={model}
                        ></ModelCard>
                    </div>
                )}
            </div>

            {/* <div className='flex gap-2'>
                <label htmlFor='inFill'>Výplň:</label>
                <select
                    onChange={(e) => setInFill(Number(e.target.value))}
                    className='w-full'
                    name='inFill'
                    id='inFill'
                >
                    <option value={0.2}>20%</option>
                    <option value={0.4}>40%</option>
                    <option value={0.7}>70%</option>
                </select>
            </div> */}

            {/*TODO: Tady jsou platne inputs */}

            <Select
                isRequired
                label='Pevnost'
                placeholder='Zvolte pevnost'
                defaultSelectedKeys={[modelQuality]}
                classNames={{
                    selectorIcon: 'text-black',
                    trigger: 'bg-gray-200 data-[hover=true]:bg-gray-300',
                }}
                onChange={(e) => {
                    setModelQuality(e.target.value)
                }}
            >
                <SelectItem key={'low'}>{'Nízká'}</SelectItem>
                <SelectItem key={'medium'}>{'Střední'}</SelectItem>
                <SelectItem key={'high'}>{'Vysoká'}</SelectItem>
            </Select>

            <Select
                isRequired
                label='Materiál'
                placeholder='Zvolte materiál'
                defaultSelectedKeys={[material]}
                classNames={{
                    selectorIcon: 'text-black',
                    trigger: 'bg-gray-200 data-[hover=true]:bg-gray-300',
                }}
                onChange={(e) => {
                    setMaterial(e.target.value)
                }}
            >
                <SelectItem key={'PLA'}>{'PLA'}</SelectItem>
                <SelectItem key={'Pet-Ge'}>{'Pet-G'}</SelectItem>
                <SelectItem key={'ASA'}>{'ASA'}</SelectItem>
                <SelectItem key={'PA - Nylon'}>{'PA - Nylon'}</SelectItem>
            </Select>

            <Select
                isRequired
                label='Kvalita povrchu'
                placeholder='Zvolte kvalitu povrchu'
                defaultSelectedKeys={[surfaceQuality]}
                classNames={{
                    selectorIcon: 'text-black',
                    trigger: 'bg-gray-200 data-[hover=true]:bg-gray-300',
                }}
                onChange={(e) => {
                    setSurfaceQuality(e.target.value)
                }}
            >
                {}
                <SelectItem key={'rough'}>{'Hrubá'}</SelectItem>
                <SelectItem key={'standart'}>{'Standardní'}</SelectItem>
                <SelectItem key={'soft'}>{'Jemná'}</SelectItem>
            </Select>

            <Select
                isRequired
                label='Barva'
                placeholder='Zvolte barvu'
                defaultSelectedKeys={[modelColor]}
                classNames={{
                    selectorIcon: 'text-black',
                    trigger: 'bg-gray-200 data-[hover=true]:bg-gray-300',
                }}
                onChange={(e) => setModelColor(e.target.value)}
            >
                <SelectItem key={'black'}>{'Černá'}</SelectItem>
                <SelectItem key={'white'}>{'Bílá'}</SelectItem>

                <SelectItem key={'other'}>{'Jiná'}</SelectItem>
            </Select>

            {modelColor === 'other' && (
                <Input
                    classNames={{
                        inputWrapper:
                            'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                    }}
                    type='text'
                    label='Zadejte barvu'
                />
                // <input
                //     required
                //     placeholder='Zadejte barvu'
                //     type='text'
                //     name='otherColor'
                //     id='otherColor'
                // />
            )}

            <Select
                isRequired
                label='Prostředí'
                placeholder='Zvolte prostředí, kde bude výtisk používán'
                defaultSelectedKeys={[enviroment]}
                classNames={{
                    selectorIcon: 'text-black',
                    trigger: 'bg-gray-200 data-[hover=true]:bg-gray-300',
                }}
                onChange={(e) => setEnviroment(e.target.value)}
            >
                <SelectItem key={'in'}>{'V interiéru'}</SelectItem>
                <SelectItem key={'ext'}>{'V exteriéru'}</SelectItem>
                <SelectItem key={'sun'}>{'Na slunci'}</SelectItem>
            </Select>

            <Input
                classNames={{
                    inputWrapper:
                        'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                }}
                type='number'
                min={1}
                max={500}
                placeholder='0'
                label='Zadejte počet kusů'
                onChange={(e) => setCount(+e.target.value)}
            />

            <div className='h-5'>
                {formErr.length > 0 && (
                    <p className='text-sm text-red-500 text-right'>{formErr}</p>
                )}
            </div>

            <div className='flex flex-col gap-2 '>
                <Button
                    onClick={showResult}
                    className='bg-gradient-to-tr from-violet from-30% to-pink text-white shadow-lg flex-1 text-lg font-semibold py-1'
                >
                    Vypočítat cenu
                </Button>
            </div>
        </form>
    )
}

export default FormWithModel
