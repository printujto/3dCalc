type modelParams = {
    dimensions: { x: number; y: number; z: number }
    surface: number
    volume: number
    innerVolume: number
}
interface dataPreset {
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

const getPrice = ({
    modelParams,
    modelQuality,
    surfaceQuality,
    material,
    dataPreset,
    count,
}: {
    modelParams: modelParams
    modelQuality: string
    surfaceQuality: string
    material: string
    dataPreset: dataPreset
    count: number
}) => {
    console.log(modelParams)
    console.log(modelQuality)
    console.log(surfaceQuality)
    console.log(material)
    console.log(dataPreset)

    let qualityPercentage = 0
    let materialPrice = 0
    let fillPercentage = 0
    let perimeterCount = 0
    let materialDensity = 0
    let coefficient = 0

    if (!modelParams || !modelQuality || !surfaceQuality || !material) return

    //Nastavení ceny za materiál a hustota materiálu
    if (material === 'PLA') {
        materialPrice = dataPreset.materialPrices.PLA
        materialDensity = 1.24
    } else if (material === 'PETG') {
        materialPrice = dataPreset.materialPrices.PETG
        materialDensity = 1.27
    } else if (material === 'ASA') {
        materialPrice = dataPreset.materialPrices.ASA
        materialDensity = 1.04
    } else if (material === 'ABS') {
        materialPrice = dataPreset.materialPrices.ABS
        materialDensity = 1.04
    } else if (material === 'PC') {
        materialPrice = dataPreset.materialPrices.PC
        materialDensity = 1.04
    } else if (material === 'TPU') {
        materialPrice = dataPreset.materialPrices.TPU
        materialDensity = 1.24
    }
    console.log(materialPrice)
    console.log(materialDensity)

    //Nastavení procent za kvalitu povrchu
    if (surfaceQuality === 'rough') {
        qualityPercentage = dataPreset.surfaceQualityPricing.rough
    } else if (surfaceQuality === 'standard') {
        qualityPercentage = dataPreset.surfaceQualityPricing.standard
    } else if (surfaceQuality === 'soft') {
        qualityPercentage = dataPreset.surfaceQualityPricing.soft
    }
    console.log(qualityPercentage)

    //Nastavení procent výplně a perimetru

    if (modelQuality === 'low') {
        fillPercentage = 0.2
        perimeterCount = 2
        coefficient = 1
    } else if (modelQuality === 'medium') {
        fillPercentage = 0.4
        perimeterCount = 4
        coefficient = 0.86
    } else if (modelQuality === 'high') {
        fillPercentage = 0.7
        perimeterCount = 6
        coefficient = 1.05
    }
    console.log(fillPercentage)
    console.log(perimeterCount)

    let totalPrice
    let totalWeightRound
    //Samotný výpočet

    console.log(modelParams)
    if (modelParams.dimensions.x < 0.15) {
        console.log('mensi nez 1.5mm')

        const oneSideSurface = modelParams.surface / 2

        const customObjectVolume = oneSideSurface * modelParams.dimensions.x

        console.log(customObjectVolume)

        const totalWeight = customObjectVolume * materialDensity
        const price = totalWeight * materialPrice

        totalPrice = Math.ceil(price + price * qualityPercentage) * count
        totalWeightRound = Math.round(totalWeight * 100) / 100
    } else if (modelParams.dimensions.y < 0.15) {
        const oneSideSurface = modelParams.surface / 2

        const customObjectVolume = oneSideSurface * modelParams.dimensions.y

        const onesideSurface =
            modelParams.dimensions.x * modelParams.dimensions.y

        console.log(onesideSurface)

        console.log(oneSideSurface * modelParams.dimensions.y)
        console.log('.....................')

        console.log(customObjectVolume)

        const totalWeight = customObjectVolume * materialDensity
        console.log(totalWeight)

        const price = totalWeight * materialPrice

        totalPrice = Math.ceil(price + price * qualityPercentage) * count
        totalWeightRound = Math.round(totalWeight * 100) / 100
    } else if (modelParams.dimensions.z < 0.15) {
        const oneSideSurface = modelParams.surface / 2
        const customObjectVolume = oneSideSurface * modelParams.dimensions.z

        console.log(customObjectVolume)

        const totalWeight = customObjectVolume * materialDensity
        const price = totalWeight * materialPrice

        totalPrice = Math.ceil(price + price * qualityPercentage) * count
        totalWeightRound = Math.round(totalWeight * 100) / 100
    } else {
        if (modelQuality === 'low' || modelQuality === 'medium') {
            const objectVolume = modelParams.volume
            const objectSurfaceVolume =
                modelParams.surface * 0.45 * perimeterCount

            // console.log('Surface volume: ' + objectSurfaceVolume)
            // console.log('Object 100 weight: ' + objectVolume * 1.24)

            const fillVolume =
                (objectVolume - objectSurfaceVolume) * fillPercentage
            const totalVolume = fillVolume + objectSurfaceVolume

            const totalWeight = totalVolume * materialDensity * coefficient
            // console.log('Total W:' + totalWeight)

            const price = totalWeight * materialPrice

            totalPrice = Math.ceil(price + price * qualityPercentage) * count

            totalWeightRound = Math.round(totalWeight * 100) / 100
        } else {
            const totalVolume = modelParams.volume

            const innerVolume = modelParams.innerVolume

            const wallVolume = totalVolume - innerVolume
            const fillVolume = (totalVolume - wallVolume) * fillPercentage

            const wallVolumeWeight = wallVolume * materialDensity
            const fillVolumeWeight = fillVolume * materialDensity

            const totalWeight =
                (wallVolumeWeight + fillVolumeWeight) * coefficient

            const price = totalWeight * materialPrice

            totalPrice = Math.ceil(price + price * qualityPercentage)
            totalWeightRound = Math.round(totalWeight * 100) / 100
            // console.log('Váha skorepiny= ' + wallVolume * 1.24)
            // console.log('Váha výplně =' + fillVolume * 1.24)

            // console.log('opravena vaha= ' + (wallVolume + fillVolume) * 1.24)
        }
    }

    return { totalWeightRound, totalPrice }
}

export default getPrice
