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
    materialPrices: [
        {
            material: string
            price: number
            density: number
        }
    ]
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
    let materialPrice: undefined | number = 0
    let fillPercentage = 0
    let perimeterCount = 0
    let materialDensity: undefined | number = 0
    let coefficient = 0

    if (!modelParams || !modelQuality || !surfaceQuality || !material) return

    //Nastavení ceny za materiál a hustota materiálu
    //TODO:zmenit funkcionalitu hledani
    console.log('.xdjfsldjfljals.fasdfjasdl')

    materialPrice = dataPreset.materialPrices.find((selectedMaterial) => {
        return selectedMaterial.material === material
    })?.price

    materialDensity = dataPreset.materialPrices.find((selectedMaterial) => {
        return selectedMaterial.material === material
    })?.density

    if (!materialPrice || !materialDensity) return
    // if (material === 'PLA') {
    //     materialPrice = dataPreset.materialPrices.PLA
    //     materialDensity = 1.24
    // } else if (material === 'PETG') {
    //     materialPrice = dataPreset.materialPrices.PETG
    //     materialDensity = 1.27
    // } else if (material === 'ASA') {
    //     materialPrice = dataPreset.materialPrices.ASA
    //     materialDensity = 1.04
    // } else if (material === 'ABS') {
    //     materialPrice = dataPreset.materialPrices.ABS
    //     materialDensity = 1.04
    // } else if (material === 'PC') {
    //     materialPrice = dataPreset.materialPrices.PC
    //     materialDensity = 1.04
    // } else if (material === 'TPU') {
    //     materialPrice = dataPreset.materialPrices.TPU
    //     materialDensity = 1.24
    // }
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

        const customObjectVolume =
            oneSideSurface * modelParams.dimensions.x * 10

        console.log(customObjectVolume)

        const totalWeight = customObjectVolume * materialDensity
        const price = totalWeight * materialPrice

        totalPrice = Math.ceil(price + price * qualityPercentage) * count
        totalWeightRound = Math.round(totalWeight * 100) / 100
    } else if (modelParams.dimensions.y < 0.15) {
        const oneSideSurface = modelParams.surface / 2

        const customObjectVolume = oneSideSurface * modelParams.dimensions.y

        const totalWeight = customObjectVolume * materialDensity * 10

        const price = totalWeight * materialPrice

        totalPrice = Math.ceil(price + price * qualityPercentage) * count
        totalWeightRound = Math.round(totalWeight * 100) / 100
    } else if (modelParams.dimensions.z < 0.15) {
        const oneSideSurface = modelParams.surface / 2
        const customObjectVolume = oneSideSurface * modelParams.dimensions.z

        const totalWeight = customObjectVolume * materialDensity
        const price = totalWeight * materialPrice

        totalPrice = Math.ceil(price + price * qualityPercentage) * count
        totalWeightRound = Math.round(totalWeight * 100) / 100
    } else {
        if (modelQuality === 'low' || modelQuality === 'medium') {
            const objectVolume = modelParams.volume
            const objectSurfaceVolume =
                modelParams.surface * 0.45 * perimeterCount

            const fillVolume =
                (objectVolume - objectSurfaceVolume) * fillPercentage
            const totalVolume = fillVolume + objectSurfaceVolume

            const totalWeight = totalVolume * materialDensity * coefficient

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

            const totalPriceHigh = Math.ceil(price + price * qualityPercentage)

            //check price for medium

            const objectVolume = modelParams.volume
            const objectSurfaceVolume = modelParams.surface * 0.45 * 4

            const fillVolumeMed = (objectVolume - objectSurfaceVolume) * 0.4
            const totalVolumeMed = fillVolumeMed + objectSurfaceVolume

            const totalWeightMed = totalVolumeMed * materialDensity * 0.86

            const priceMed = totalWeightMed * materialPrice
            const totalPriceMed = Math.ceil(
                priceMed + priceMed * qualityPercentage
            )

            //porovnavani vysledku v med a high quality
            if (totalPriceMed > totalPriceHigh) {
                totalPrice = totalPriceMed * count
                totalWeightRound = Math.round(totalWeightMed * 100) / 100
            } else {
                totalPrice = totalPriceHigh * count
                totalWeightRound = Math.round(totalWeight * 100) / 100
            }
        }
        console.log('Total weight:' + totalWeightRound)
    }

    return { totalWeightRound, totalPrice }
}

export default getPrice
