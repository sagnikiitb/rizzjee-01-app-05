export const CHAT_ID = 'search' as const
// So from what I understand, this file SEPARATELY DEFINES just the CHAT_ID parameter
// One entire file just for one thing
// Code modularity
// 'as const' this ensures stronger type-safety, as in now CHAT_ID is not just a string anymore
// It has a separate type defined as 'search'
// Which extends the 'string' type
