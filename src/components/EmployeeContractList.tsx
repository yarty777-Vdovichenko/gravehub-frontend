import { useState } from 'react';
import { ErrorBox } from './ErrorBox';
import { OrderRow } from './OrderRow';
import { Pagination } from './Pagination';
import { Spinner } from './Spinner';
import { useList } from './useList';
export function EmployeeContractList(){const[status,setStatus]=useState('');const list=useList('/employee/my-contracts',status);return <><h1>Моя робота</h1><select aria-label="Статус роботи" value={status} onChange={e=>{setStatus(e.target.value);list.setPage(1)}}><option value="">Усі статуси</option>{['open','in_progress','awaiting_confirmation','completed','cancelled'].map(s=><option key={s}>{s}</option>)}</select><section className="panel">{list.loading?<Spinner/>:list.error?<ErrorBox text={list.error} retry={list.reload}/>:list.items.length?list.items.map(c=><OrderRow key={c.id} c={c}/>):<p>Замовлень немає.</p>}<Pagination page={list.page} total={list.total} onChange={list.setPage}/></section></>}
