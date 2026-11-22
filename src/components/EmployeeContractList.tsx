import { ErrorBox } from './ErrorBox';
import { OrderRow } from './OrderRow';
import { Pagination } from './Pagination';
import { Spinner } from './Spinner';
import { useList } from './useList';
export function EmployeeContractList(){const list=useList('/employee/my-contracts/my','');return <><h1>Моя робота</h1><section className="panel">{list.loading?<Spinner/>:list.error?<ErrorBox text={list.error} retry={list.reload}/>:list.items.length?list.items.map(c=><OrderRow key={c.id} c={c}/>):<p>Замовлень немає.</p>}<Pagination page={list.page} total={list.total} onChange={list.setPage}/></section></>}
