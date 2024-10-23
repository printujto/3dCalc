import * as THREE from 'three'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'

export function loadOBJModel(data) {
    const objLoader = new OBJLoader()
    const object = objLoader.parse(data)

    let totalVolume = 0
    let totalSurfaceArea = 0
    let dimensions = { x: 0, y: 0, z: 0 }

    object.traverse((child) => {
        if (child.isMesh && child.geometry) {
            const { totalVolume: volume } = calculateExactVolume(child.geometry)
            totalVolume += volume

            const surfaceArea = calculateSurfaceArea(child.geometry)
            totalSurfaceArea += surfaceArea / 10
            const { width, height, depth } = calculateObjectDimensions(
                child.geometry
            )
            dimensions = { x: width, y: height, z: depth }
        }
    })

    return { totalVolume, totalSurfaceArea, dimensions }
}

export function loadSTLModel(data) {
    const stlLoader = new STLLoader()
    const geometry = stlLoader.parse(data)

    // Přesný výpočet objemu
    const { totalVolume } = calculateExactVolume(geometry)

    const surfaceArea = calculateSurfaceArea(geometry) / 10

    const { width, height, depth } = calculateObjectDimensions(geometry)
    const dimensions = { x: width, y: height, z: depth }

    return { totalVolume, surfaceArea, dimensions }
}

//TODO: logika: z povrchu vynasobit 0.9 - 2 perim... tento objem pote odecist od celku, obe cisla vynasobit materialem 1.24 a mam gramy

function calculateExactVolume(geometry) {
    let totalVolume = 0

    // Ujistíme se, že geometrie je ve formátu BufferGeometry
    const bufferGeometry = geometry.isBufferGeometry
        ? geometry
        : new THREE.BufferGeometry().fromGeometry(geometry)

    // Získáme pozice vrcholů trojúhelníků
    const positions = bufferGeometry.attributes.position.array
    const vectorA = new THREE.Vector3()
    const vectorB = new THREE.Vector3()
    const vectorC = new THREE.Vector3()

    for (let i = 0; i < positions.length; i += 9) {
        // Získání tří vrcholů trojúhelníku (A, B, C)
        vectorA.set(positions[i], positions[i + 1], positions[i + 2])
        vectorB.set(positions[i + 3], positions[i + 4], positions[i + 5])
        vectorC.set(positions[i + 6], positions[i + 7], positions[i + 8])

        // Výpočet objemu trojúhelníkové plochy jako tetrahedru s počátkem (0,0,0)
        totalVolume += signedVolumeOfTriangle(vectorA, vectorB, vectorC)
    }

    // Vypočítáme bounding box pro rozměry
    bufferGeometry.computeBoundingBox()
    const boundingBox = bufferGeometry.boundingBox

    const size = new THREE.Vector3()
    boundingBox.getSize(size)

    totalVolume = Math.abs(totalVolume) / 1000
    return { totalVolume } // Vracíme absolutní hodnotu objemu
}

// Výpočet podepsaného objemu jednoho trojúhelníku jako tetrahedru
function signedVolumeOfTriangle(v1, v2, v3) {
    return v1.dot(v2.cross(v3)) / 6.0
}

function calculateSurfaceArea(geometry) {
    let totalSurfaceArea = 0

    // Ujistíme se, že geometrie je ve formátu BufferGeometry
    const bufferGeometry = geometry.isBufferGeometry
        ? geometry
        : new THREE.BufferGeometry().fromGeometry(geometry)

    // Získáme pozice vrcholů trojúhelníků
    const positions = bufferGeometry.attributes.position.array
    const vectorA = new THREE.Vector3()
    const vectorB = new THREE.Vector3()
    const vectorC = new THREE.Vector3()

    const edge1 = new THREE.Vector3()
    const edge2 = new THREE.Vector3()

    for (let i = 0; i < positions.length; i += 9) {
        // Získání tří vrcholů trojúhelníku (A, B, C) a převedení na cm
        vectorA.set(
            positions[i] / 10,
            positions[i + 1] / 10,
            positions[i + 2] / 10
        )
        vectorB.set(
            positions[i + 3] / 10,
            positions[i + 4] / 10,
            positions[i + 5] / 10
        )
        vectorC.set(
            positions[i + 6] / 10,
            positions[i + 7] / 10,
            positions[i + 8] / 10
        )

        // Vektory tvořené hranami trojúhelníku
        edge1.subVectors(vectorB, vectorA) // AB
        edge2.subVectors(vectorC, vectorA) // AC

        // Plocha trojúhelníku je polovina velikosti vektorového součinu dvou hran
        const triangleArea = edge1.cross(edge2).length() / 2
        totalSurfaceArea += triangleArea
    }

    // Povrch už je nyní ve správných jednotkách cm²
    return totalSurfaceArea // Vracíme celkovou povrchovou plochu v cm²
}

function calculateObjectDimensions(geometry) {
    // Ujistíme se, že geometrie je ve formátu BufferGeometry
    const bufferGeometry = geometry.isBufferGeometry
        ? geometry
        : new THREE.BufferGeometry().fromGeometry(geometry)

    // Spočítáme bounding box geometrie
    bufferGeometry.computeBoundingBox()
    const boundingBox = bufferGeometry.boundingBox

    // Získáme minimální a maximální hodnoty souřadnic z bounding boxu
    const min = boundingBox.min
    const max = boundingBox.max

    // Vypočítáme rozměry (šířku, výšku a hloubku) v centimetrech
    const width = (max.x - min.x) / 10 // z mm na cm
    const height = (max.y - min.y) / 10 // z mm na cm
    const depth = (max.z - min.z) / 10 // z mm na cm

    return { width, height, depth } // Vrátíme rozměry v cm
}

// function scaleGeometry(geometry, wallThickness) {
//     // Clone the original geometry to avoid modifying it
//     const scaledGeometry = geometry.clone()

//     // Calculate the bounding box for geometry
//     geometry.computeBoundingBox()
//     const boundingBox = geometry.boundingBox

//     // Get the size of the object (bounding box dimensions)
//     const size = new THREE.Vector3()
//     boundingBox.getSize(size)

//     // Ensure that the wall thickness is less than half of any dimension to avoid invalid scaling
//     const scaleX = Math.max(1 - wallThickness / size.x, 0.01)
//     const scaleY = Math.max(1 - wallThickness / size.y, 0.01)
//     const scaleZ = Math.max(1 - wallThickness / size.z, 0.01)
//     console.log(scaleX)
//     console.log(scaleY)

//     // Scale the geometry towards its center
//     scaledGeometry.scale(scaleX, scaleY, scaleZ)

//     return scaledGeometry
// }

// function calculateFaceNormals(geometry) {
//     const positions = geometry.attributes.position.array
//     const normals = []
//     const vectorA = new THREE.Vector3()
//     const vectorB = new THREE.Vector3()
//     const vectorC = new THREE.Vector3()
//     const normal = new THREE.Vector3()

//     for (let i = 0; i < positions.length; i += 9) {
//         vectorA.set(positions[i], positions[i + 1], positions[i + 2])
//         vectorB.set(positions[i + 3], positions[i + 4], positions[i + 5])
//         vectorC.set(positions[i + 6], positions[i + 7], positions[i + 8])

//         // Vytvoříme vektory mezi vrcholy
//         const edge1 = vectorB.clone().sub(vectorA)
//         const edge2 = vectorC.clone().sub(vectorA)

//         // Vektorový součin vektorů tvoří normálu
//         normal.crossVectors(edge1, edge2).normalize()

//         normals.push(normal.clone())
//     }
//     return normals
// }

// function offsetGeometry(geometry, wallThickness) {
//     const positions = geometry.attributes.position.array
//     const normals = calculateFaceNormals(geometry)

//     const newPositions = []
//     const vectorA = new THREE.Vector3()
//     const vectorB = new THREE.Vector3()
//     const vectorC = new THREE.Vector3()

//     for (let i = 0; i < positions.length; i += 9) {
//         // Získání tří vrcholů trojúhelníku
//         vectorA.set(positions[i], positions[i + 1], positions[i + 2])
//         vectorB.set(positions[i + 3], positions[i + 4], positions[i + 5])
//         vectorC.set(positions[i + 6], positions[i + 7], positions[i + 8])

//         const normal = normals[Math.floor(i / 9)] // Normála pro tento trojúhelník

//         // Posunutí vrcholů podél normály
//         vectorA.addScaledVector(normal, -wallThickness)
//         vectorB.addScaledVector(normal, -wallThickness)
//         vectorC.addScaledVector(normal, -wallThickness)

//         // Přidání nových vrcholů do nové geometrie
//         newPositions.push(vectorA.x, vectorA.y, vectorA.z)
//         newPositions.push(vectorB.x, vectorB.y, vectorB.z)
//         newPositions.push(vectorC.x, vectorC.y, vectorC.z)
//     }

//     // Vytvoříme novou BufferGeometry s offsetovanými vrcholy
//     const newGeometry = new THREE.BufferGeometry()
//     newGeometry.setAttribute(
//         'position',
//         new THREE.Float32BufferAttribute(newPositions, 3)
//     )

//     return newGeometry
// }

// function calculateShellVolume(geometry, wallThickness) {
//     // Výpočet původního objemu
//     const { totalVolume: outerVolume } = calculateExactVolume(geometry)

//     // Offsetování pro vnitřní plochu
//     const innerGeometry = offsetGeometry(geometry, wallThickness)
//     console.log('//////')

//     console.log(outerVolume)

//     // Výpočet objemu vnitřní plochy
//     const { totalVolume: innerVolume } = calculateExactVolume(innerGeometry)
//     console.log(innerVolume)

//     // Objem skořepiny = rozdíl mezi původním a vnitřním objemem
//     const shellVolume = outerVolume - innerVolume
//     return shellVolume
// }
