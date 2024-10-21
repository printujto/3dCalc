const getPrice = (modelParams, material, inFill) => {
    console.log(modelParams.volume, inFill)

    const effectiveVolume = modelParams.volume * inFill

    const weight = effectiveVolume * material

    console.log(weight)

    return weight
}

export default getPrice
