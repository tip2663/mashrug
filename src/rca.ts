import storefront from './assets/storefront.json'

export const rcas = Object.values(storefront).flatMap(obj=> Object.values(obj)).flatMap(obj => Object.values(obj))
export type rca = typeof rcas[0]
export const getBodyId = (rca:rca) => rca.accessory_ids.filter(acc => acc.includes('body') && !acc.includes('body_bottom'))[0]?.slice(-11) ?? null
export const getFaceLowerId = (rca:rca) => rca.accessory_ids.filter(acc => acc.includes('face_lower'))[0]?.slice(-11) ?? null
export const getEyesId = (rca:rca) => rca.accessory_ids.filter(acc => acc.includes('face_upper'))[0]?.slice(-11) ?? null
export const getBodyLowerId = (rca:rca) => rca.accessory_ids.filter(acc => acc.includes('body_bottom'))[0]?.slice(-11) ?? null
export const getHatId = (rca:rca) => rca.accessory_ids.filter(acc => acc.includes('head_accessory'))[0]?.slice(-11) ?? null
export const getBackdrop = (rca:rca) => rca.background_image

export const getResById = (str:string | null) => !str ? '' : `https://i.redd.it/snoovatar/snoo_assets/submissions/${str}_.svg`

export const getHairBottomId = (rca:rca) => {
    const hairStr = rca.accessory_ids.filter(acc => acc.includes('hair'))[0]
    if(!hairStr){
        return null;
    }
    let match = hairStr.match(/([^_]+)$/);
    if (match) {
        return match[1];
    }
    return null;
}

export const getHairTopId = (rca:rca) => {
    const hairStr = rca.accessory_ids.filter(acc => acc.includes('hair'))[0]?.split('_hair_')[1]
    if(!hairStr){
        return null;
    }
    let match = hairStr.match(/^(.+?)_[^_]+$/);
    if (match) {
        return match[1];
    }
    return null;
}