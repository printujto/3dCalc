import ModelCard from '../ModelCard'
import { useCallback, useEffect, useState } from 'react'
import { loadOBJModel, loadSTLModel } from '../../utils/loadModel'
import getPrice from '../../utils/getPrice'
import { SelectItem, Select, Input, Button, Textarea } from '@nextui-org/react'
import Dropzone, { useDropzone } from 'react-dropzone'
import emailjs from '@emailjs/browser'
import toast from 'react-hot-toast'
import axios from 'axios'
import JSZip from 'jszip'

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

const FormWithModel = ({
    handleSendSuccess,
}: {
    handleSendSuccess: (state: boolean) => void
}) => {
    const [dataPreset, setDataPreset] = useState<dataPreset>()
    const [finalSegment, setFinalSegment] = useState(false)
    const [noCountMode, setNoCountMode] = useState(false)
    const [formErr, setFormErr] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [model, setModel] = useState<File>()

    const [modelDimensions, setModelDimensions] = useState<modelParams | null>(
        null
    )

    const [material, setMaterial] = useState('PLA')
    const [modelQuality, setModelQuality] = useState('low')
    const [surfaceQuality, setSurfaceQuality] = useState('rough')

    const [modelColor, setModelColor] = useState('black')
    const [customColor, setCustomColor] = useState('')
    const [enviroment, setEnviroment] = useState('in')
    const [count, setCount] = useState(1)

    const [orderPrice, setOrderPrice] = useState(0)
    const [agreeMinPrice, setAgreeMinPrice] = useState(true)
    const [modelWeight, setModelWeight] = useState(0)

    //UserInfo
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [street, setStreet] = useState('')
    const [city, setCity] = useState('')
    const [zipCode, setZipCode] = useState('')
    const [note, setNote] = useState('')

    const onDrop = useCallback((acceptedFiles) => {
        // Do something with the files
    }, [])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
    })

    useEffect(() => {
        axios
            .get('https://res.cloudinary.com/dlhgypwnv/raw/upload/config.json')
            .then((res) => {
                setDataPreset(res.data)
            })
    }, [])

    useEffect(() => {
        showResult()
    }, [modelQuality, material, surfaceQuality, count, model])

    const showResult = async () => {
        if (!model) {
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

            const modelParams = await getModelParams(model)

            if (!modelParams || !dataPreset) return

            const result = getPrice({
                dataPreset,
                modelParams,
                modelQuality,
                surfaceQuality,
                material,
                count,
            })

            if (!modelParams) return

            if (!result) return

            setOrderPrice(result?.totalPrice)
            setModelWeight(result.totalWeightRound)
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
        setIsSending(true)
        if (!model) {
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
        } else if (orderPrice < 200 && !agreeMinPrice) {
            setFormErr('Minimální cena 200 Kč musí být odsouhlasena')
        } else {
            setFormErr('')

            const customFileName =
                model.name.split('.')[0] + '_' + firstName + '_' + lastName

            const uploadData = new FormData()
            uploadData.append('upload_preset', 'file_upload_preset')
            uploadData.append('public_id', customFileName)
            uploadData.append('folder', 'models')
            uploadData.append('file', model)

            const cldUrl =
                'https://api.cloudinary.com/v1_1/dlhgypwnv/raw/upload'
            try {
                if (!cldUrl || !modelDimensions) return

                const result = await axios.post(cldUrl, uploadData)

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
                    enviroment:
                        (enviroment === 'in' && 'Interiér') ||
                        (enviroment === 'ext' && 'Exteriér') ||
                        (enviroment === 'sun' && 'Na přímém slunci'),
                    surfaceQuality:
                        (surfaceQuality === 'rough' && 'Hrubá') ||
                        (surfaceQuality === 'standard' && 'Standardní') ||
                        (surfaceQuality === 'soft' && 'Jemná'),
                    material: material,
                    modelColor:
                        modelColor === 'other' ? customColor : modelColor,

                    modelWeight: modelWeight,
                    modelDimensionX:
                        Math.round(modelDimensions?.dimensions?.x * 100) / 100,
                    modelDimensionY:
                        Math.round(modelDimensions?.dimensions?.y * 100) / 100,
                    modelDimensionZ:
                        Math.round(modelDimensions?.dimensions?.z * 100) / 100,

                    count: count,
                    orderPrice: orderPrice,

                    modelUrl: result.data.secure_url,
                }

                const emailjsServiceID = import.meta.env.VITE_EMAILJS_SERVICE_ID
                const emailjsTemplateID = import.meta.env
                    .VITE_EMAILJS_TEMPLATE_ID
                const emailjsSecret = import.meta.env.VITE_EMAILJS_SECRET

                if (!emailjsServiceID || !emailjsTemplateID || !emailjsSecret)
                    return

                const sendPromise = emailjs
                    .send(
                        'service_9itde3s',
                        emailjsTemplateID,
                        formData,
                        emailjsSecret
                    )
                    .then(
                        () => {
                            handleSendSuccess(true)
                        },
                        (error) => {
                            setFormErr('Někde nastala chyba')
                        }
                    )

                toast.promise(sendPromise, {
                    loading: 'Sending',
                    success: 'Formulář odeslán',
                    error: 'Někde se stala chyba',
                })
            } catch (error) {
                if (error) {
                    console.log(error)
                }
            }
        }
    }

    const sendRequest = async () => {
        const formData = new FormData()
        const zip = new JSZip()

        if (!model) return

        zip.file(model.name, model)

        const zipBlob = await zip.generateAsync({ type: 'blob' })
        formData.append('file', zipBlob, `${model.name}_Firstname_LastName`)

        const sendPromise = axios
            .post('https://printujtoserver.onrender.com/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            .then((res) => {
                console.log(res)
            })

        toast.promise(sendPromise, {
            loading: 'Sending',
            success: 'Formulář odeslán',
            error: 'Někde se stala chyba',
        })
    }

    return (
        <div>
            {/* <div
                className='w-10 h-10 bg-red-500'
                onClick={() => setFinalSegment((prev) => !prev)}
            ></div> */}
            <Button onClick={sendRequest}>Send request</Button>
            <form id='form' className=' mt-4'>
                <section
                    className={`${
                        finalSegment ? 'hidden' : 'flex'
                    } flex-col gap-2`}
                >
                    <div className='flex items-center justify-center w-full'>
                        {!model ? (
                            <Dropzone
                                onDrop={(e) => {
                                    const extension = e[0].name
                                        .split('.')
                                        .pop()
                                        .toLowerCase()
                                        .toString()
                                    console.log(extension)

                                    if (
                                        extension === 'obj' ||
                                        extension === 'stl' ||
                                        extension === 'stp'
                                    ) {
                                        if (!model) {
                                            setModel(e[0])
                                        }
                                    }
                                }}
                            >
                                {({ getRootProps, getInputProps }) => (
                                    <div
                                        {...getRootProps()}
                                        className='flex flex-col items-center justify-center w-full h-52 border-2 border-gray-400 border-dashed rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-200 duration-200'
                                    >
                                        <>
                                            <div className='flex flex-col items-center justify-center pt-5 pb-6 select-none'>
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
                                        </>
                                    </div>
                                )}
                            </Dropzone>
                        ) : (
                            <div className='p-4 w-full h-52 border-2 border-gray-400 border-dashed rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-200 duration-200'>
                                <ModelCard
                                    handleDelete={() => {
                                        setModel(undefined)
                                        setModelDimensions(null)
                                        setModelWeight(0)
                                        setOrderPrice(0)
                                    }}
                                    model={model}
                                ></ModelCard>
                            </div>
                        )}
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
                                    trigger: `${
                                        modelQuality
                                            ? 'bg-gray-200 data-[hover=true]:bg-gray-300'
                                            : 'bg-red-200 data-[hover=true]:bg-red-300'
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
                                    trigger: `${
                                        material
                                            ? 'bg-gray-200 data-[hover=true]:bg-gray-300'
                                            : 'bg-red-200 data-[hover=true]:bg-red-300'
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
                                    trigger: `${
                                        surfaceQuality
                                            ? 'bg-gray-200 data-[hover=true]:bg-gray-300'
                                            : 'bg-red-200 data-[hover=true]:bg-red-300'
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
                                    trigger: `${
                                        enviroment
                                            ? 'bg-gray-200 data-[hover=true]:bg-gray-300'
                                            : 'bg-red-200 data-[hover=true]:bg-red-300'
                                    } max-w-full`,
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
                                    trigger: `${
                                        modelColor
                                            ? 'bg-gray-200 data-[hover=true]:bg-gray-300'
                                            : 'bg-red-200 data-[hover=true]:bg-red-300'
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
                                                ? 'bg-red-200 data-[hover=true]:bg-red-300 data-[focus=true]:!bg-red-300'
                                                : 'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300'
                                        }`,
                                    }}
                                    type='text'
                                    label='Zadejte barvu'
                                />
                            )}
                        </div>
                    </div>
                    <Input
                        classNames={{
                            inputWrapper:
                                'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                        }}
                        type='number'
                        min={1}
                        max={500}
                        label='Zadejte počet kusů'
                        defaultValue={count.toString()}
                        onChange={(e) => setCount(+e.target.value)}
                    />

                    <div className='h-5'>
                        {formErr.length > 0 && (
                            <p className='text-sm text-red-500 text-right'>
                                {formErr}
                            </p>
                        )}
                    </div>
                </section>
                <div
                    className={`flex ${
                        finalSegment ? 'flex-col-reverse' : 'flex-col'
                    }`}
                >
                    {!noCountMode && (
                        <section className='mt-2 text-right'>
                            <p>Váha {modelWeight} g</p>
                            <h2 className='text-md'>
                                Celková cena:{' '}
                                <span className='text-2xl'>
                                    {orderPrice} Kč
                                </span>
                            </h2>

                            {orderPrice < 200 && (
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
                                            cenovou úroveň (200 Kč)
                                        </label>
                                        <input
                                            checked={agreeMinPrice}
                                            onChange={() =>
                                                setAgreeMinPrice(
                                                    (prev) => !prev
                                                )
                                            }
                                            type='checkbox'
                                            name='agreePrice'
                                            id='agreePrice'
                                        />
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    <section className={finalSegment ? 'text-left' : 'flex'}>
                        <Button
                            onClick={() => {
                                if (!model) {
                                    console.log('nebyl zadan objekt')
                                    setFormErr('Nahrajte 3d objekt')
                                } else if (
                                    !modelQuality ||
                                    !enviroment ||
                                    !surfaceQuality ||
                                    !material ||
                                    !modelColor ||
                                    (modelColor === 'other' &&
                                        customColor === '')
                                ) {
                                    setFormErr('Vyplňte všechny povinné údaje')
                                } else if (count <= 0) {
                                    setFormErr('Zadejte počet kusů')
                                } else if (orderPrice < 200 && !agreeMinPrice) {
                                    setFormErr(
                                        'Minimální cena 200 Kč musí být odsouhlasena'
                                    )
                                } else {
                                    setFormErr('')
                                    setFinalSegment((prev) => !prev)
                                }
                            }}
                            className='mt-2 bg-gradient-to-tr from-violet from-30% to-pink text-white shadow-lg flex-1 text-lg font-semibold py-1'
                        >
                            {finalSegment ? (
                                <span>Jít zpět</span>
                            ) : (
                                <span>Přejít na objednávku</span>
                            )}
                        </Button>
                    </section>
                </div>

                {finalSegment && (
                    <section className='flex flex-col gap-2 mt-4'>
                        <p>Kontaktní údaje:</p>
                        <section className='flex gap-2'>
                            <Input
                                isRequired
                                className='w-full'
                                classNames={{
                                    inputWrapper:
                                        'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                                }}
                                onChange={(e) => setFirstName(e.target.value)}
                                type='text'
                                label='Křestní jméno'
                            />
                            <Input
                                isRequired
                                className='w-full'
                                classNames={{
                                    inputWrapper:
                                        'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
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
                                inputWrapper:
                                    'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                            }}
                            onChange={(e) => setEmail(e.target.value)}
                            type='text'
                            label='email'
                        />
                        <Input
                            isRequired
                            className='w-full'
                            classNames={{
                                inputWrapper:
                                    'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
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
                                inputWrapper:
                                    'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
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
                                    inputWrapper:
                                        'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                                }}
                                onChange={(e) => setCity(e.target.value)}
                                type='text'
                                label='Město'
                            />
                            <Input
                                isRequired
                                className='w-full'
                                classNames={{
                                    inputWrapper:
                                        'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                                }}
                                onChange={(e) => setZipCode(e.target.value)}
                                type='text'
                                label='PSČ'
                            />
                        </section>
                        <Textarea
                            label='Poznámka'
                            placeholder='Zde můžete napsat dodatečné informace'
                            classNames={{
                                inputWrapper:
                                    'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
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

                        <Button
                            onClick={(e) => sendOrder(e)}
                            type='submit'
                            className='mt-2 bg-gradient-to-tr from-violet from-30% to-pink text-white shadow-lg flex-1 text-lg font-semibold py-1'
                        >
                            {isSending ? (
                                <p>Odesílání</p>
                            ) : (
                                <p>Nezávazně objednat</p>
                            )}
                        </Button>
                    </section>
                )}
            </form>
        </div>
    )
}

export default FormWithModel
