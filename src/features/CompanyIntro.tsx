import {
  Boxes,
  Factory,
  FlaskConical,
  GraduationCap,
  ShieldCheck,
  Store,
} from "lucide-react";
import { Button } from "../components/os/controls";
import "./companyIntro.css";

const services = [
  {
    icon: FlaskConical,
    name: "SymProduct",
    description: "Desenvolvimento e formulação de produtos",
  },
  {
    icon: Factory,
    name: "SymPlant",
    description: "Engenharia de plantas e processos",
  },
  {
    icon: Boxes,
    name: "SymSupply",
    description: "Compras e homologação de fornecedores",
  },
  {
    icon: ShieldCheck,
    name: "SymQuality",
    description: "Documentação técnica e auditorias",
  },
  {
    icon: GraduationCap,
    name: "SymAcademy",
    description: "Treinamento de equipes operacionais",
  },
  {
    icon: Store,
    name: "SymGoMarket",
    description: "Apoio comercial para chegar ao mercado",
  },
];

export function CompanyIntro({ onAccess }: { onAccess: () => void }) {
  return (
    <section className="os-company-intro" aria-labelledby="company-intro-title">
      <div className="os-company-copy">
        <div className="os-onboarding-brand">
          sym<span>OS</span>
          <small>by Symco</small>
        </div>
        <div>
          <p className="os-company-label">Symco Food Tech</p>
          <h1 id="company-intro-title">
            Engenharia para a indústria de alimentos
          </h1>
          <p className="os-company-description">
            A Symco atua como uma extensão do seu time. Reúne especialistas sob
            demanda para ajudar pequenas e médias empresas a desenvolver
            produtos, melhorar processos e levar seus alimentos ao mercado.
          </p>
        </div>
        <Button
          variant="primary"
          className="os-company-access-button"
          onClick={onAccess}
        >
          Acessar o SymOS
        </Button>
      </div>

      <div className="os-company-services">
        <h2>Como a Symco atua</h2>
        <ul>
          {services.map(({ icon: Icon, name, description }) => (
            <li key={name}>
              <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
              <h3>{name}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ul>
        <p className="os-company-platform">
          O <strong>SymOS</strong> é a plataforma da Symco para acompanhar
          projetos, tarefas, documentos e aprovações em um só lugar.
        </p>
      </div>
    </section>
  );
}
