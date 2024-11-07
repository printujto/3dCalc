import ModelCard from '../ModelCard'
import { useEffect, useState } from 'react'
import { loadOBJModel, loadSTLModel } from '../../utils/loadModel'
import getPrice from '../../utils/getPrice'
import {
    SelectItem,
    Select,
    Input,
    Button,
    Textarea,
    RadioGroup,
    Radio,
    Link,
} from '@nextui-org/react'
import Dropzone from 'react-dropzone'
import toast from 'react-hot-toast'
import axios from 'axios'
import sendForm from '../../utils/sendForm'
import React from 'react'

type modelParams = {
    dimensions: { x: number; y: number; z: number }
}
type dataPreset = {
    surfaceQualityPricing: {
        rough: number
        standard: number
        soft: number
    }
    materialPrices: {
        PLA: number
        PETG: number
        ASA: number
        ABS: number
        PC: number
        TPU: number
    }
    carriers: [
        {
            name: string
            price: number
        }
    ]
}

type modelsResults = {
    model: string
    weight: number
    price: number
}[]

const FormWithModel = ({
    handleSendSuccess,
    handleIsUploading,
}: {
    handleSendSuccess: (state: boolean) => void
    handleIsUploading: (state: boolean) => void
}) => {
    const [dataPreset, setDataPreset] = useState<dataPreset>()
    const [finalSegment, setFinalSegment] = useState(false)
    const [noCountMode, setNoCountMode] = useState(false)
    const [formErr, setFormErr] = useState('')

    const [models, setModels] = useState<FileList>()
    const [modelsResults, setModelsResults] = useState<modelsResults>([])

    const [modelDimensions, setModelDimensions] = useState<modelParams | null>(
        null
    )

    const [material, setMaterial] = useState('PLA')
    const [modelQuality, setModelQuality] = useState('low')
    const [surfaceQuality, setSurfaceQuality] = useState('standard')

    const [modelColor, setModelColor] = useState('black')
    const [customColor, setCustomColor] = useState('')
    const [enviroment, setEnviroment] = useState('in')
    const [count, setCount] = useState(1)

    const [printPrice, setPrintPrice] = useState(0)
    const [carrierPrice, setCarrierPrice] = useState(0)
    const [agreeMinPrice, setAgreeMinPrice] = useState(false)
    const [agreeTerms, setAgreeTerms] = useState(true)

    //UserInfo
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [street, setStreet] = useState('')
    const [city, setCity] = useState('')
    const [zipCode, setZipCode] = useState('')
    const [selectedCarrier, setSelectedCarrier] = useState('')
    const [note, setNote] = useState('')

    useEffect(() => {
        axios
            .get('https://res.cloudinary.com/dlhgypwnv/raw/upload/config.json')
            .then((res) => {
                setDataPreset(res.data)
                setCarrierPrice(res.data.carriers[0].price)
                setSelectedCarrier(res.data.carriers[0].name)
            })
    }, [])

    useEffect(() => {
        showResult()
    }, [modelQuality, material, surfaceQuality, count, models])

    const showResult = async () => {
        if (!models || models.length <= 0) {
            setFormErr('Nahrajte 3d objekt')
        } else if (
            !modelQuality ||
            !enviroment ||
            !surfaceQuality ||
            !material ||
            !modelColor ||
            (modelColor === 'other' && customColor === '')
        ) {
            setFormErr('Vyplňte všechny povinné údaje')
        } else if (count <= 0) {
            setFormErr('Zadejte počet kusů')
        } else {
            setFormErr('')
            const allModelsResult: React.SetStateAction<modelsResults> = []
            let totalPrice = 0
            Array.from(models).forEach(async (model) => {
                const modelParams = await getModelParams(model)

                if (!modelParams || !dataPreset) return

                const result = getPrice({
                    dataPreset,
                    modelParams,
                    modelQuality,
                    surfaceQuality,
                    material,
                    count: models.length === 1 ? count : 1,
                })

                console.log(result)

                if (!modelParams) return

                if (!result) return

                const newModelResult = {
                    model: model.name,
                    weight: result.totalWeightRound,
                    price: result.totalPrice,
                }

                allModelsResult.push(newModelResult)

                setModelsResults(allModelsResult)

                totalPrice = totalPrice + result.totalPrice

                setPrintPrice(totalPrice)
            })
        }
    }

    const getModelParams = (model: File) => {
        setNoCountMode(false)
        return new Promise((resolve, reject) => {
            if (!model) return reject('No model provided')

            let volume, surface, dimensions, innerVolume

            const reader = new FileReader()

            const extension = model.name.split('.').pop().toLowerCase()

            if (extension === 'obj') {
                reader.readAsText(model)
            } else if (extension === 'stl') {
                reader.readAsArrayBuffer(model)
            } else {
                setNoCountMode(true)
                setFormErr('Lze počítat jen s formáty .obj a .stl')
                return reject('Nepodporovaný formát')
            }

            reader.onload = function (e: ProgressEvent<FileReader>) {
                if (!e.target) return reject('Failed to read the file')

                try {
                    if (extension === 'obj') {
                        const {
                            totalVolume,
                            totalSurfaceArea,
                            dimensions: objDimensions,
                            innerVolume: inVolume,
                        } = loadOBJModel(e.target.result as string)

                        volume = totalVolume
                        surface = totalSurfaceArea
                        dimensions = objDimensions
                        innerVolume = inVolume

                        setModelDimensions({
                            dimensions: {
                                x: dimensions.x,
                                y: dimensions.y,
                                z: dimensions.z,
                            },
                        })
                    } else if (extension === 'stl') {
                        const {
                            totalVolume,
                            surfaceArea,
                            dimensions: objDimensions,
                            innerVolume: inVolume,
                        } = loadSTLModel(e.target.result as ArrayBuffer)

                        volume = totalVolume
                        surface = surfaceArea
                        dimensions = objDimensions
                        innerVolume = inVolume
                        setModelDimensions({
                            dimensions: {
                                x: dimensions.x,
                                y: dimensions.y,
                                z: dimensions.z,
                            },
                        })
                    } else {
                        setNoCountMode(true)
                        setFormErr('Lze počítat jen s formáty .obj a .stl')
                        return reject('Nepodporovaný formát')
                    }

                    // Resolve the promise with the calculated values
                    resolve({ volume, surface, dimensions, innerVolume })
                } catch (err) {
                    reject('Error processing the model')
                }
            }

            reader.onerror = function () {
                reject('Failed to read the file')
            }
        })
    }

    const sendOrder: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        e.preventDefault()

        if (!models) {
            setFormErr('Nahrajte 3d objekt')
        } else if (
            !modelQuality ||
            !enviroment ||
            !surfaceQuality ||
            !material ||
            !modelColor ||
            (modelColor === 'other' && customColor === '') ||
            !firstName ||
            !lastName ||
            !phone ||
            !email ||
            !street ||
            !city ||
            !zipCode
        ) {
            setFormErr('Vyplňte všechny povinné údaje')
        } else if (count <= 0) {
            setFormErr('Zadejte počet kusů')
        } else if (printPrice < 200 && !agreeMinPrice) {
            setFormErr('Minimální cena 200 Kč musí být odsouhlasena')
        } else if (!agreeTerms) {
            setFormErr('Obchodní podmínky musí být odsouhlaseny')
        } else {
            setFormErr('')
            handleIsUploading(true)
            try {
                if (!modelDimensions) return

                let allModels: string = ''

                modelsResults.map((model) => {
                    const modelStat = `${model.model} - Váha: ${model.weight} g, Vypočítaná cena: ${model.price} Kč ||`
                    allModels = allModels + modelStat
                })

                console.log(allModels)

                const formData = {
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone,
                    email: email,
                    street: street,
                    city: city,
                    zipcode: zipCode,
                    note: note,
                    modelQuality: modelQuality,
                    enviroment: {
                        in: 'Interiér',
                        ext: 'Exteriér',
                        sun: 'Exteriér',
                    }[enviroment],
                    surfaceQuality:
                        (surfaceQuality === 'rough' && 'Hrubá') ||
                        (surfaceQuality === 'standard' && 'Standardní') ||
                        (surfaceQuality === 'soft' && 'Jemná'),
                    material: material,
                    modelColor:
                        modelColor === 'other' ? customColor : modelColor,
                    allModels: allModels,
                    // modelWeight: modelWeight,
                    // modelDimensionX:
                    //     Math.round(modelDimensions?.dimensions?.x * 100) / 100,
                    // modelDimensionY:
                    //     Math.round(modelDimensions?.dimensions?.y * 100) / 100,
                    // modelDimensionZ:
                    //     Math.round(modelDimensions?.dimensions?.z * 100) / 100,

                    count: models.length === 1 ? count : 1,
                    orderPrice:
                        printPrice > 200
                            ? printPrice + carrierPrice
                            : 200 + carrierPrice,
                    carrier: selectedCarrier,
                    carrierPrice: carrierPrice,
                    printPrice: printPrice,
                }
                //TODO: Počítáme, teď stačí předělat send na více modelů.. to už mám pomocí funkce sendFiles, jinak to bude stejné
                const sendingPromise = sendForm(formData, models).then(
                    (response) => {
                        if (response?.status === 200) {
                            handleSendSuccess(true)
                            console.log('nahrannee')
                        }
                    }
                )

                toast.promise(sendingPromise, {
                    loading: 'Odesílní formuláře',
                    success: 'Data úspěšně dorazily',
                    error: 'Někde se stala chyba',
                })
            } catch (error) {
                if (error) {
                    console.log(error)
                }
            }
        }
    }

    const carriersCollection =
        dataPreset?.carriers.map((carrier, i) => (
            <Radio
                color='secondary'
                key={carrier.name}
                value={i.toString()}
            >{`${carrier.name} (${carrier.price} Kč)`}</Radio>
        )) || []

    return (
        <div className={`${finalSegment ? 'pr-2' : 'pr-0'} w-full`}>
            <form id='form'>
                <section
                    className={`${
                        finalSegment ? 'hidden' : 'flex'
                    } flex-col gap-2`}
                >
                    <div className='flex items-center justify-center w-full'>
                        <Dropzone
                            onDrop={(e) => {
                                const extension = e[0].name
                                    .split('.')
                                    .pop()
                                    .toLowerCase()
                                    .toString()

                                if (
                                    extension === 'obj' ||
                                    extension === 'stl' ||
                                    extension === 'stp'
                                ) {
                                    setFormErr('')

                                    if (!models) {
                                        setModels(e)
                                    } else {
                                        const filesArray = Array.from(models)
                                        const newItems = Array.from(e)

                                        newItems.forEach((item: File) => {
                                            filesArray.push(item)
                                        })

                                        const dataTransfer = new DataTransfer()

                                        filesArray.forEach((file) => {
                                            dataTransfer.items.add(file)
                                        })

                                        const newFileList = dataTransfer.files

                                        setModels(newFileList)
                                    }
                                } else {
                                    setFormErr('Formát souboru není povolen')
                                }
                            }}
                        >
                            {({ getRootProps, getInputProps }) => (
                                <div
                                    {...getRootProps()}
                                    className='flex flex-col items-center justify-center w-full h-52 border-2 border-gray-700/50 border-dashed rounded-lg cursor-pointer bg-gray-300/50 hover:bg-gray-200/50 duration-200'
                                >
                                    <>
                                        <div
                                            className={`${
                                                !models || models.length < 1
                                                    ? 'items-center justify-center'
                                                    : 'items-start justify-start p-2 gap-2 overflow-y-scroll '
                                            } select-none flex flex-col w-full h-full`}
                                        >
                                            <input
                                                {...getInputProps()}
                                                required
                                                // onChange={(e) => {
                                                //     if (
                                                //         !e.target.files ||
                                                //         e.target.files.length <
                                                //             1
                                                //     )
                                                //         return
                                                //     setModel(e.target.files[0])
                                                // }}
                                                type='file'
                                                accept='.obj, .stl, .stp'
                                                name='file'
                                                id='dropzone-file'
                                                className='hidden'
                                            />

                                            {!models || models.length <= 0 ? (
                                                <>
                                                    <svg
                                                        className='w-8 h-8 mb-4  '
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
                                                    <p className='mb-2 text-sm '>
                                                        <span className='font-semibold'>
                                                            Nahrát 3D model
                                                        </span>
                                                    </p>
                                                    <p className='text-xs '>
                                                        .OBJ, .STL, .STP (MAX.
                                                        300 MB)
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    {models &&
                                                        Array.from(models).map(
                                                            (model, i) => (
                                                                <React.Fragment
                                                                    key={i}
                                                                >
                                                                    <ModelCard
                                                                        handleDelete={(
                                                                            id: number,
                                                                            event: React.MouseEvent
                                                                        ) => {
                                                                            console.log(
                                                                                id
                                                                            )
                                                                            event.preventDefault()
                                                                            event.stopPropagation()

                                                                            const modelListArray =
                                                                                Array.from(
                                                                                    models
                                                                                )
                                                                            modelListArray.splice(
                                                                                id,
                                                                                1
                                                                            )

                                                                            const dataTransfer =
                                                                                new DataTransfer()

                                                                            modelListArray.forEach(
                                                                                (
                                                                                    model
                                                                                ) => {
                                                                                    dataTransfer.items.add(
                                                                                        model
                                                                                    )
                                                                                }
                                                                            )

                                                                            const newModelList =
                                                                                dataTransfer.files

                                                                            setModels(
                                                                                newModelList
                                                                            )

                                                                            setModelDimensions(
                                                                                null
                                                                            )

                                                                            setPrintPrice(
                                                                                0
                                                                            )
                                                                        }}
                                                                        id={i}
                                                                        model={
                                                                            model
                                                                        }
                                                                    ></ModelCard>
                                                                </React.Fragment>
                                                            )
                                                        )}
                                                </>
                                            )}
                                        </div>
                                    </>
                                </div>
                            )}
                        </Dropzone>
                    </div>
                    <div className='flex w-full gap-2'>
                        <div className='flex flex-col gap-2 flex-1'>
                            <Select
                                isRequired
                                label='Pevnost'
                                placeholder='Zvolte pevnost'
                                defaultSelectedKeys={[modelQuality]}
                                classNames={{
                                    selectorIcon: 'text-black',
                                    label: 'text-gray-600',
                                    trigger: `${
                                        modelQuality
                                            ? 'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 shadow-md'
                                            : 'bg-red-400/50 data-[hover=true]:bg-red-400/60 shadow-md'
                                    }`,
                                }}
                                onChange={(e) => {
                                    setModelQuality(e.target.value)
                                }}
                            >
                                <SelectItem key={'low'}>{'Nízká'}</SelectItem>
                                <SelectItem key={'medium'}>
                                    {'Střední'}
                                </SelectItem>
                                <SelectItem key={'high'}>{'Vysoká'}</SelectItem>
                            </Select>

                            <Select
                                isRequired
                                label='Materiál'
                                placeholder='Zvolte materiál'
                                defaultSelectedKeys={[material]}
                                classNames={{
                                    selectorIcon: 'text-black',
                                    label: 'text-gray-600',
                                    trigger: `${
                                        material
                                            ? 'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 shadow-md'
                                            : 'bg-red-400/50 data-[hover=true]:bg-red-400/60 shadow-md'
                                    }`,
                                }}
                                onChange={(e) => {
                                    setMaterial(e.target.value)
                                }}
                            >
                                <SelectItem key={'PLA'}>{'PLA'}</SelectItem>
                                <SelectItem key={'PETG'}>{'Pet-G'}</SelectItem>
                                <SelectItem key={'ASA'}>{'ASA'}</SelectItem>
                                <SelectItem key={'ABS'}>{'ABS'}</SelectItem>
                                <SelectItem key={'PC'}>{'PC'}</SelectItem>
                                <SelectItem key={'TPU'}>{'TPU'}</SelectItem>
                            </Select>

                            <Select
                                isRequired
                                label='Kvalita povrchu'
                                placeholder='Zvolte kvalitu povrchu'
                                defaultSelectedKeys={[surfaceQuality]}
                                classNames={{
                                    selectorIcon: 'text-black',
                                    label: 'text-gray-600',
                                    trigger: `${
                                        surfaceQuality
                                            ? 'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 shadow-md'
                                            : 'bg-red-400/50 data-[hover=true]:bg-red-400/60 shadow-md'
                                    }`,
                                }}
                                onChange={(e) => {
                                    setSurfaceQuality(e.target.value)
                                }}
                            >
                                <SelectItem key={'rough'}>{'Hrubá'}</SelectItem>
                                <SelectItem key={'standard'}>
                                    {'Standardní'}
                                </SelectItem>
                                <SelectItem key={'soft'}>{'Jemná'}</SelectItem>
                            </Select>
                        </div>
                        <div className='flex flex-col gap-2 flex-1'>
                            <Select
                                isRequired
                                label='Prostředí'
                                placeholder='Zvolte prostředí'
                                defaultSelectedKeys={[enviroment]}
                                className='overflow-hidden'
                                classNames={{
                                    selectorIcon: 'text-black',
                                    label: 'text-gray-600',
                                    trigger: `${
                                        enviroment
                                            ? 'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 shadow-md'
                                            : 'bg-red-400/50 data-[hover=true]:bg-red-400/60 shadow-md'
                                    }`,
                                }}
                                onChange={(e) => setEnviroment(e.target.value)}
                            >
                                <SelectItem key={'in'}>
                                    {'V interiéru'}
                                </SelectItem>
                                <SelectItem key={'ext'}>
                                    {'V exteriéru'}
                                </SelectItem>
                                <SelectItem key={'sun'}>
                                    {'Na slunci'}
                                </SelectItem>
                            </Select>

                            <Select
                                isRequired
                                label='Barva'
                                placeholder='Zvolte barvu'
                                defaultSelectedKeys={[modelColor]}
                                classNames={{
                                    selectorIcon: 'text-black',
                                    label: 'text-gray-600',
                                    trigger: `${
                                        modelColor
                                            ? 'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 shadow-md'
                                            : 'bg-red-400/50 data-[hover=true]:bg-red-400/60 shadow-md'
                                    }`,
                                }}
                                onChange={(e) => setModelColor(e.target.value)}
                            >
                                <SelectItem key={'black'}>{'Černá'}</SelectItem>
                                <SelectItem key={'white'}>{'Bílá'}</SelectItem>

                                <SelectItem key={'other'}>{'Jiná'}</SelectItem>
                            </Select>

                            {modelColor === 'other' && (
                                <Input
                                    onChange={(e) =>
                                        setCustomColor(e.target.value)
                                    }
                                    classNames={{
                                        inputWrapper: `${
                                            customColor === ''
                                                ? 'bg-red-400/50 data-[hover=true]:bg-red-400/60 shadow-md data-[focus=true]:!bg-red-300'
                                                : 'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70'
                                        }`,
                                    }}
                                    type='text'
                                    label='Zadejte barvu'
                                />
                            )}
                        </div>
                    </div>
                    {models?.length === 1 && (
                        <Input
                            classNames={{
                                label: 'text-gray-600',
                                inputWrapper:
                                    'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                            }}
                            type='number'
                            min={1}
                            max={500}
                            label='Zadejte počet kusů'
                            defaultValue={count.toString()}
                            onChange={(e) => setCount(+e.target.value)}
                        />
                    )}
                    <div className='h-5'>
                        {formErr.length > 0 && (
                            <p className='text-sm text-red-500 text-right'>
                                {formErr}
                            </p>
                        )}
                    </div>
                </section>

                <section className={finalSegment ? 'text-left' : 'flex'}>
                    <Button
                        onClick={() => {
                            if (!models || models.length <= 0) {
                                setFormErr('Nahrajte 3D modely')
                            } else if (
                                !modelQuality ||
                                !enviroment ||
                                !surfaceQuality ||
                                !material ||
                                !modelColor ||
                                (modelColor === 'other' && customColor === '')
                            ) {
                                setFormErr('Vyplňte všechny povinné údaje')
                            } else if (count <= 0) {
                                setFormErr('Zadejte počet kusů')
                            } else {
                                setFormErr('')
                                setFinalSegment((prev) => !prev)
                            }
                        }}
                        className={`${
                            finalSegment ? 'mt-0' : 'mt-2'
                        } bg-gradient-to-tr from-violet from-30% to-pink text-white shadow-lg flex-1 text-lg font-semibold py-1`}
                    >
                        {finalSegment ? (
                            <span>Jít zpět</span>
                        ) : (
                            <span>Přejít na objednávku</span>
                        )}
                    </Button>
                </section>

                {finalSegment && (
                    <section className='flex flex-col gap-2 mt-4'>
                        <p>Kontaktní údaje:</p>
                        <section className='flex gap-2'>
                            <Input
                                isRequired
                                className='w-full'
                                classNames={{
                                    label: 'text-gray-600',
                                    inputWrapper:
                                        'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                                }}
                                onChange={(e) => setFirstName(e.target.value)}
                                type='text'
                                label='Křestní jméno'
                            />
                            <Input
                                isRequired
                                className='w-full'
                                classNames={{
                                    label: 'text-gray-600',
                                    inputWrapper:
                                        'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                                }}
                                onChange={(e) => setLastName(e.target.value)}
                                type='text'
                                label='Přijmení'
                            />
                        </section>

                        <Input
                            isRequired
                            className='w-full'
                            classNames={{
                                label: 'text-gray-600',
                                inputWrapper:
                                    'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                            }}
                            onChange={(e) => setEmail(e.target.value)}
                            type='text'
                            label='email'
                        />
                        <Input
                            isRequired
                            className='w-full'
                            classNames={{
                                label: 'text-gray-600',
                                inputWrapper:
                                    'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                            }}
                            onChange={(e) => setPhone(e.target.value)}
                            type='text'
                            label='telefon'
                        />
                        <p>Adresa:</p>
                        <Input
                            isRequired
                            className='w-full'
                            classNames={{
                                label: 'text-gray-600',
                                inputWrapper:
                                    'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                            }}
                            onChange={(e) => setStreet(e.target.value)}
                            type='text'
                            label='Ulice'
                        />
                        <section className='flex gap-2'>
                            <Input
                                isRequired
                                className='w-full'
                                classNames={{
                                    label: 'text-gray-600',
                                    inputWrapper:
                                        'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                                }}
                                onChange={(e) => setCity(e.target.value)}
                                type='text'
                                label='Město'
                            />
                            <Input
                                isRequired
                                className='w-full'
                                classNames={{
                                    label: 'text-gray-600',
                                    inputWrapper:
                                        'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                                }}
                                onChange={(e) => setZipCode(e.target.value)}
                                type='text'
                                label='PSČ'
                            />
                        </section>
                        <RadioGroup
                            defaultValue={'0'}
                            classNames={{
                                label: 'text-black',
                            }}
                            label='Vyberte dopravce'
                            onChange={(e) => {
                                const index = Number(e.target.value)

                                if (dataPreset)
                                    setCarrierPrice(
                                        dataPreset?.carriers[index].price
                                    )
                                setSelectedCarrier(
                                    dataPreset?.carriers[index].name
                                )
                            }}
                        >
                            {carriersCollection}
                        </RadioGroup>
                        <Textarea
                            label='Poznámka'
                            placeholder='Zde můžete napsat dodatečné informace'
                            classNames={{
                                label: 'text-gray-600',
                                inputWrapper:
                                    'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                            }}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        <div className='h-5'>
                            {formErr.length > 0 && (
                                <p className='text-sm text-red-500 text-right'>
                                    {formErr}
                                </p>
                            )}
                        </div>
                    </section>
                )}

                <div
                    className={`flex ${finalSegment ? 'flex-col' : 'flex-col'}`}
                >
                    {!noCountMode && (
                        <section className='mt-2 text-right flex flex-col items-end'>
                            <h2 className='text-md'>
                                Odhadovaná cena za tisk:{' '}
                                {agreeMinPrice ? (
                                    <span className='font-semibold'>
                                        200 Kč
                                    </span>
                                ) : (
                                    <span className='font-semibold'>
                                        {printPrice} Kč
                                    </span>
                                )}
                            </h2>

                            {finalSegment && (
                                <>
                                    <h2 className='text-md'>
                                        Doprava:{' '}
                                        <span className='font-semibold'>
                                            {carrierPrice} Kč
                                        </span>
                                    </h2>
                                    <h2 className='text-md'>
                                        Cena celkem:{' '}
                                        {agreeMinPrice ? (
                                            <span className='text-2xl'>
                                                {200 + carrierPrice} Kč
                                            </span>
                                        ) : (
                                            <span className='text-2xl'>
                                                {printPrice + carrierPrice} Kč
                                            </span>
                                        )}
                                    </h2>
                                </>
                            )}

                            {printPrice < 200 && (
                                <div>
                                    <p className='text-red-500 text-md'>
                                        Minimální cena tisku je 200 Kč
                                    </p>

                                    <div className='flex justify-end gap-2'>
                                        <label
                                            className='text-sm'
                                            htmlFor='agreePrice'
                                        >
                                            Souhlasím, s tiskem za minimální
                                            cenovou úroveň{' '}
                                            <span className='text-nowrap'>
                                                (200 Kč)
                                            </span>
                                        </label>
                                        <input
                                            checked={agreeMinPrice}
                                            onChange={() => {
                                                setAgreeMinPrice(
                                                    (prev) => !prev
                                                )
                                            }}
                                            type='checkbox'
                                            name='agreePrice'
                                            id='agreePrice'
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className='flex justify-end gap-2'>
                                    <label
                                        className='text-sm'
                                        htmlFor='agreeTerms'
                                    >
                                        Souhlasím, s{' '}
                                        <Link
                                            className='text-violet hover:text-violet-hover duration-200'
                                            target='_blank'
                                            href='https://printujto.cz/obchodni-podminky'
                                        >
                                            Obchodníma podmínkama
                                        </Link>
                                    </label>
                                    <input
                                        checked={agreeTerms}
                                        onChange={() => {
                                            setAgreeTerms((prev) => !prev)
                                        }}
                                        type='checkbox'
                                        name='agreeTerms'
                                        id='agreeTerms'
                                    />
                                </div>
                            </div>
                        </section>
                    )}
                    {finalSegment && (
                        <Button
                            onClick={(e) => sendOrder(e)}
                            type='submit'
                            className='mt-2 bg-gradient-to-tr from-violet from-30% to-pink text-white shadow-lg flex-1 text-lg font-semibold py-1'
                        >
                            <p>Nezávazně objednat</p>
                        </Button>
                    )}
                </div>
            </form>
        </div>
    )
}

export default FormWithModel
