import ModelCard from '../ModelCard'
import { useState } from 'react'
import { loadOBJModel, loadSTLModel } from '../../utils/loadModel'
import getPrice from '../../utils/getPrice'
import { SelectItem, Select, Input, Button } from '@nextui-org/react'
import emailjs from '@emailjs/browser'
import toast from 'react-hot-toast'
import axios from 'axios'
import FinalSegmentForm from './FinalSegmentForm'

type modelParams = {
    volume: number
    surface: number
    dimensions: { x: number; y: number; z: number }
}

const FormWithModel = () => {
    const [finalSegment, setFinalSegment] = useState(false)
    const [formErr, setFormErr] = useState('')
    const [model, setModel] = useState<File>()

    const [modelParams, setModelParams] = useState<modelParams | null>(null)

    const [material, setMaterial] = useState('PLA')
    const [modelQuality, setModelQuality] = useState('low')
    const [surfaceQuality, setSurfaceQuality] = useState('rough')

    const [modelColor, setModelColor] = useState('black')
    const [enviroment, setEnviroment] = useState('in')
    const [count, setCount] = useState(0)

    const [orderPrice, setOrderPrice] = useState(0)
    const [agreeMinPrice, setAgreeMinPrice] = useState(true)

    // console.log(modelQuality)
    // console.log(surfaceQuality)
    // console.log(material)
    // console.log(enviroment)
    // console.log('Count:' + count)
    // console.log(modelParams)

    const showResult = async () => {
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

            const modelParams = await getModelParams(model)

            if (!modelParams) return

            const result = getPrice({
                modelParams,
                modelQuality,
                surfaceQuality,
                material,
            })
            if (!modelParams) return
            console.log(result)
            if (!result) return

            setOrderPrice(Math.floor(result?.priceAfterQualityCheck))

            // const weight = getPrice(modelParams, material, inFill)
        }
    }

    const getModelParams = (model: File) => {
        return new Promise((resolve, reject) => {
            if (!model) return reject('No model provided')

            let volume, surface, dimensions

            const reader = new FileReader()
            const extension = model.name.split('.').pop().toLowerCase()

            if (extension === 'obj') {
                reader.readAsText(model)
            } else if (extension === 'stl') {
                reader.readAsArrayBuffer(model)
            } else {
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
                        } = loadOBJModel(e.target.result as string)

                        volume = totalVolume
                        surface = totalSurfaceArea
                        dimensions = objDimensions
                    } else if (extension === 'stl') {
                        const {
                            totalVolume,
                            surfaceArea,
                            dimensions: objDimensions,
                        } = loadSTLModel(e.target.result as ArrayBuffer)

                        volume = totalVolume
                        surface = surfaceArea
                        dimensions = objDimensions
                    } else {
                        return reject('Nepodporovaný formát')
                    }

                    // Resolve the promise with the calculated values
                    resolve({ volume, surface, dimensions })
                } catch (error) {
                    reject('Error processing the model')
                }
            }

            reader.onerror = function () {
                reject('Failed to read the file')
            }
        })
    }

    //TODO: nejdrive vyresit nacenovani a pak odesilani formulare se vsemi daty
    const sendOrder = async () => {
        //TODO: tady jeste jedno overovani, jestli jsou vsechny potrebne data zadane a posilas

        if (model) {
            const uploadData = new FormData()
            uploadData.append('upload_preset', 'file_upload_preset')
            uploadData.append('public_id', model.name.split('.')[0])
            uploadData.append('file', model)
            // uploadData.append('from_name', 'Pavel novotny')

            try {
                const result = await axios.post(
                    'https://api.cloudinary.com/v1_1/dlhgypwnv/raw/upload', // správná adresa pro soubory
                    uploadData
                )

                const formData = {
                    from_user: 'Test user',
                    message: 'Zprava od uzivatele',
                    modelUrl: result.data.secure_url,
                }

                const sendPromise = emailjs
                    .send(
                        'service_9itde3s',
                        'template_mef5ebc',
                        formData,
                        'wZ-guyfVuBq-M1VSk'
                    )
                    .then(
                        () => {
                            console.log('SUCCESS!')
                        },
                        (error) => {
                            console.log(error)

                            console.log('FAILED...', error.text)
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
        } else {
            console.log('neni model')
        }
    }

    return (
        <div>
            {/* <div
                className='w-10 h-10 bg-red-500'
                onClick={() => setFinalSegment((prev) => !prev)}
            ></div> */}
            <form
                id='form'
                className=' mt-4'
                // onSubmit={(e) => submitForm(e)}
            >
                <section
                    className={`${
                        finalSegment ? 'hidden' : 'flex'
                    } flex-col gap-2`}
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
                                            setOrderPrice(0)
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
                                {}
                                <SelectItem key={'rough'}>{'Hrubá'}</SelectItem>
                                <SelectItem key={'standart'}>
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
                                    classNames={{
                                        inputWrapper:
                                            'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
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
                        placeholder='0'
                        label='Zadejte počet kusů'
                        onChange={(e) => setCount(+e.target.value)}
                    />

                    <div className='h-5'>
                        {formErr.length > 0 && (
                            <p className='text-sm text-red-500 text-right'>
                                {formErr}
                            </p>
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

                    <section className='mt-2 text-right'>
                        <h2 className='text-md'>
                            Celková cena:{' '}
                            <span className='text-2xl'>{orderPrice} Kč</span>
                        </h2>
                        <p className='text-md'>vč. DPH</p>
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
                                        Souhlasím, s tiskem za minimální cenovou
                                        úroveň (200 Kč)
                                    </label>
                                    <input
                                        checked={agreeMinPrice}
                                        onChange={() =>
                                            setAgreeMinPrice((prev) => !prev)
                                        }
                                        type='checkbox'
                                        name='agreePrice'
                                        id='agreePrice'
                                    />
                                </div>
                            </div>
                        )}
                        <Button
                            // onClick={sendOrder}
                            className='mt-2 bg-gradient-to-tr from-violet from-30% to-pink text-white shadow-lg flex-1 text-lg font-semibold py-1'
                        >
                            Přejít na objednávku
                        </Button>
                    </section>
                </section>
                {finalSegment && <FinalSegmentForm></FinalSegmentForm>}
            </form>
        </div>
    )
}

export default FormWithModel
