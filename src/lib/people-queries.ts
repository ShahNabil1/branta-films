import { queryOptions } from '@tanstack/react-query';
import { getPeopleDirectory, getPersonDetail } from './people.functions';
export const directoryQuery=(staff:boolean,search='',page=0)=>queryOptions({queryKey:['people',staff,search,page],queryFn:()=>getPeopleDirectory({data:{staff,search,page}}),staleTime:10_000,refetchInterval:20_000});
export const personQuery=(id:string,page=0)=>queryOptions({queryKey:['person',id,page],queryFn:()=>getPersonDetail({data:{id,page}}),staleTime:10_000,refetchInterval:20_000});