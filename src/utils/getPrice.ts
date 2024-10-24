type modelParams = {
    dimensions: { x: number; y: number; z: number }
    surface: number
    volume: number
}

const getPrice = ({
    modelParams,
    modelQuality,
    surfaceQuality,
    material,
}: {
    modelParams: modelParams
    modelQuality: string
    surfaceQuality: string
    material: string
}) => {
    console.log(modelParams)
    console.log(modelQuality)
    console.log(surfaceQuality)
    console.log(material)
    let qualityPercentage = 0
    let materialPrice = 0
    let fillPercentage = 0
    let perimeterCount = 0
    let materialDensity = 0

    if (!modelParams || !modelQuality || !surfaceQuality || !material) return

    //Nastavení ceny za materiál a hustota materiálu
    if (material === 'PLA') {
        materialPrice = 3
        materialDensity = 1.24
    } else if (material === 'PETG') {
        materialPrice = 3
        materialDensity = 1.27
    } else if (material === 'ASA') {
        materialPrice = 4
        materialDensity = 1.04
    } else if (material === 'ABS') {
        materialPrice = 4
        materialDensity = 1.04
    } else if (material === 'PC') {
        materialPrice = 7
        materialDensity = 1.04
    } else if (material === 'TPU') {
        materialPrice = 10
        materialDensity = 1.24
    }
    console.log(materialPrice)
    console.log(materialDensity)

    //Nastavení procent za kvalitu povrchu
    if (surfaceQuality === 'rough') {
        qualityPercentage = 0
    } else if (surfaceQuality === 'standart') {
        qualityPercentage = 0.05
    } else if (surfaceQuality === 'soft') {
        qualityPercentage = 0.1
    }
    console.log(qualityPercentage)

    //Nastavení procent výplně a perimetru

    if (modelQuality === 'low') {
        fillPercentage = 0.2
        perimeterCount = 2
    } else if (modelQuality === 'medium') {
        fillPercentage = 0.4
        perimeterCount = 4
    } else if (modelQuality === 'high') {
        fillPercentage = 0.7
        perimeterCount = 6
    }
    console.log(fillPercentage)
    console.log(perimeterCount)

    let totalPrice
    let totalWeightRound
    //Samotný výpočet
    console.log('////////////////////////////////')

    console.log(modelParams)
    if (modelParams.dimensions.z < 0.15) {
        console.log('mensi nez 1.5mm')

        const objectVolume = modelParams.volume

        const oneSideSurface = modelParams.surface / 2

        const customObjectVolume = oneSideSurface * 0.45 * perimeterCount

        console.log(objectVolume)
        console.log(customObjectVolume)

        const totalWeight = customObjectVolume * materialDensity
        const price = totalWeight * materialPrice

        totalPrice = Math.ceil(price + price * qualityPercentage)
        totalWeightRound = Math.round(totalWeight * 100) / 100
    } else {
        const objectVolume = modelParams.volume
        const objectSurfaceVolume = modelParams.surface * 0.45 * perimeterCount

        console.log('Surface volume: ' + objectSurfaceVolume)
        console.log('Object 100 weight: ' + objectVolume * 1.24)

        const fillVolume = (objectVolume - objectSurfaceVolume) * fillPercentage

        const totalVolume = fillVolume + objectSurfaceVolume

        const totalWeight = totalVolume * materialDensity
        console.log('Total W:' + totalWeight)

        const price = totalWeight * materialPrice

        totalPrice = Math.ceil(price + price * qualityPercentage)

        totalWeightRound = Math.round(totalWeight * 100) / 100
    }

    return { totalWeightRound, totalPrice }
}

export default getPrice
